"use strict";(self.webpackChunkmonotone=self.webpackChunkmonotone||[]).push([[993],{993:function(n){n.exports='# Using indexes in PostgreSQL\n\n## Background\n\nI found out that a lot of engineers do not know how to add indexes on tables in PostgreSQL, or simply blindly add `BTREE` indexes onto columns they need. While it works in some situations, it is certainly not optimal for increasing query performance and enforcing database constraints.\n\n## TL;DR\n\n- Adding multicolumn `BTREE` indexes can be a no brainer, but it can be space consuming, and sometimes it does not work well.\n- Alway try to run `EXPLAIN ANALYSE` to see the query performance.\n- If you have a small table (like 100 rows), it does not really matter whether the query is done by sequential scan or not.\n\n## Problem\nWe often encounter such a situation: We have some columns related to identifiers, such as user IDs which are referenced from another table like `"Users"`. We also have some other columns which we want to do range or equality queries.\nHere we are going to prepare some data: a column for UUIDs, and two columns for integers. Indeed, in reality, we may or may not have integers, but integers are one of the simplest type to play with.\n\n## Data generation\nWe run the following query:\n```sql\nCREATE TABLE "Test" (\n  "id" UUID,\n  "a" INTEGER,\n  "b" INTEGER\n);\nINSERT INTO "Test" ("id", "a", "b")\nVALUES (GEN_RANDOM_UUID(), GENERATE_SERIES(1, 10000000, 1), FLOOR(RANDOM() * 10000000));\n```\n\nSo the first few rows will look like this:\n```\n                  id                  | a  |    b    \n--------------------------------------+----+---------\n 798bd850-e63b-46dd-b924-e9ac01353405 |  1 | 1241871\n c43bf935-f67e-485b-95fd-5a927ebf1c0d |  2 | 7414988\n 3cb88392-85cf-4ff7-9f19-1554afb02e1c |  3 | 3288640\n a7609569-0371-4d31-a40f-3c259e44b95c |  4 | 7748585\n 201a509f-7838-48a0-8d39-3aaa94365796 |  5 | 3223152\n c06b38e4-8542-4211-8162-bdb8c3abb731 |  6 | 7955327\n 46362fdc-d595-43fb-9086-c34f91fc5136 |  7 | 3082431\n 9b840e3e-af4d-47d3-93fb-77f0ec48777c |  8 | 2624720\n 8f7a0fe7-31e3-4789-86ff-2ebc38985c1d |  9 | 3623314\n 82d4b231-75da-4c0e-a57f-13bd50959587 | 10 | 4300943\n dc5dc91c-d9db-4c52-8995-910f9f8c95da | 11 | 1701849\n c2919582-5cba-4b35-b581-b57d8d4f0f65 | 12 | 7608851\n f3bff5c4-db76-42f3-97f6-4fbce6b3a9ad | 13 | 7102832\n 64a232e4-9574-462b-9473-e275cd51a932 | 14 |   37548\n d4c2c047-68ff-47b0-b1c8-290d61d75bdc | 15 | 2100687\n 7fa48b61-868e-4898-b4f8-df09069327a1 | 16 | 8474010\n 16673a50-dd27-4431-958c-5af21d18e7de | 17 | 6043888\n 210503f3-3fea-4e28-824a-6dfb468c2509 | 18 | 7275625\n d63dc92a-a5ad-4c29-8b92-f7269f27ae57 | 19 | 6327409\n de0d9f1e-c734-4687-b206-36605e774a1a | 20 |  528867\n```\n\n### Case 1: Selecting with only 1 range query\nWe want to optimize the following query:\n```sql\nSELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n```\n\nAs you can see, there is only one range query `<`, and another one is `=`.\n\nThis can affect how we should index the column. In PostgreSQL, if we are going to use `BTREE` index to index both columns, the index will be useful to limit the portion with leading equality condition and the first range condition. As such, if we are going to use multicolumn index, the most efficient way (time-complexity wise) will be:\n\n```sql\nCREATE INDEX "Test_btree_b_a" ON "Test" USING BTREE ("b", "a");\n```\n\nThe result is fast enough:\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                        QUERY PLAN                                                        \n--------------------------------------------------------------------------------------------------------------------------\n Index Scan using "Test_btree_b_a" on "Test"  (cost=0.43..8.46 rows=1 width=16) (actual time=0.556..0.556 rows=0 loops=1)\n   Index Cond: ((b = 200000) AND (a < 100000))\n Planning Time: 0.438 ms\n Execution Time: 0.618 ms\n(4 rows)\n```\n\nWithout the index, it becomes:\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                       QUERY PLAN                                                        \n-------------------------------------------------------------------------------------------------------------------------\n Gather  (cost=1000.00..133564.10 rows=1 width=16) (actual time=234.988..235.741 rows=0 loops=1)\n   Workers Planned: 2\n   Workers Launched: 2\n   ->  Parallel Seq Scan on "Test"  (cost=0.00..132564.00 rows=1 width=16) (actual time=229.455..229.455 rows=0 loops=3)\n         Filter: ((a < 100000) AND (b = 200000))\n         Rows Removed by Filter: 3333333\n Planning Time: 0.407 ms\n Execution Time: 237.205 ms\n(8 rows)\n```\nwhich is substantially slower.\n\nIt is worth reiterating that the order of index is very important. If we instead add like\n```sql\nCREATE INDEX "Test_btree_a_b" ON "Test" USING BTREE ("a", "b");\n```\n\nthen the scan will be far more ineffective\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                         QUERY PLAN                                                          \n-----------------------------------------------------------------------------------------------------------------------------\n Index Scan using "Test_btree_a_b" on "Test"  (cost=0.43..2028.50 rows=1 width=16) (actual time=7.203..7.204 rows=0 loops=1)\n   Index Cond: ((a < 100000) AND (b = 200000))\n Planning Time: 0.287 ms\n Execution Time: 7.254 ms\n(4 rows)\n```\n\nStill, index scan is not the fastest option. In PostgreSQL, there is an option to include other columns into the index, so that it saves some paper visits.\n\n```sql\nCREATE INDEX "Test_btree_b_a" ON "Test" USING BTREE ("b", "a") INCLUDE ("id");\n```\n\nThen we can achieve an Index Only Scan (do you notice the word `Only`?)\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                          QUERY PLAN                                                           \n-------------------------------------------------------------------------------------------------------------------------------\n Index Only Scan using "Test_btree_b_a" on "Test"  (cost=0.43..8.46 rows=1 width=16) (actual time=0.043..0.044 rows=0 loops=1)\n   Index Cond: ((b = 200000) AND (a < 100000))\n   Heap Fetches: 0\n Planning Time: 0.201 ms\n Execution Time: 0.087 ms\n(5 rows)\n```\n\nwhich is even faster. However, it also consumes more space.\n\n#### Single column index\n\nThe column `a` is in order. This can happen in a lot of real-word situations, such as creation timestamp. In PostgreSQL, there is a way to capitalize on such a property, which is the use of `BRIN` index.\n\n```sql\nCREATE INDEX "Test_brin_a" ON "Test" USING BRIN ("a");\n```\n\nThe `BRIN` index works by recording the minimum and maximum value in a block range. Hence, it works pretty well on the column `a` due to the order property.\n\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                          QUERY PLAN                                                           \n-------------------------------------------------------------------------------------------------------------------------------\n Bitmap Heap Scan on "Test"  (cost=16.19..74809.27 rows=1 width=16) (actual time=22.091..22.093 rows=0 loops=1)\n   Recheck Cond: (a < 100000)\n   Rows Removed by Index Recheck: 5281\n   Filter: (b = 200000)\n   Rows Removed by Filter: 99999\n   Heap Blocks: lossy=671\n   ->  Bitmap Index Scan on "Test_brin_a"  (cost=0.00..16.19 rows=109489 width=0) (actual time=0.294..0.295 rows=7680 loops=1)\n         Index Cond: (a < 100000)\n Planning Time: 0.211 ms\n Execution Time: 22.159 ms\n(10 rows)\n```\n\nNote that we can still add single column `BTREE` index. However, in this case, a `BTREE` index on `a` will not cause a substantially faster query. A `BTREE` index on `b` will, because there will be very few rows meeting `b` equal to a specific value, and therefore the filter process will be faster.\n\n```sql\nCREATE INDEX "Test_btree_a" ON "Test" USING BTREE ("a");\n```\n\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                         QUERY PLAN                                                          \n-----------------------------------------------------------------------------------------------------------------------------\n Index Scan using "Test_btree_a" on "Test"  (cost=0.43..3667.53 rows=1 width=16) (actual time=25.538..25.539 rows=0 loops=1)\n   Index Cond: (a < 100000)\n   Filter: (b = 200000)\n   Rows Removed by Filter: 99999\n Planning Time: 0.270 ms\n Execution Time: 25.584 ms\n```\n\nAdding `BTREE` on `b` only:\n```sql\nCREATE INDEX "Test_btree_b" ON "Test" USING BTREE ("b");\n```\n\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                       QUERY PLAN                                                        \n-------------------------------------------------------------------------------------------------------------------------\n Index Scan using "Test_btree_b" on "Test"  (cost=0.43..12.47 rows=1 width=16) (actual time=1.400..1.401 rows=0 loops=1)\n   Index Cond: (b = 200000)\n   Filter: (a < 100000)\n Planning Time: 0.610 ms\n Execution Time: 1.435 ms\n(5 rows)\n```\n\nHowever, if we are only using the `BTREE` index for equality query, a `HASH` index also works well:\n```sql\nCREATE INDEX "Test_hash_b" ON "Test" USING HASH ("b");\n```\n\n```\npostgres=# EXPLAIN ANALYSE SELECT "id" FROM "Test" WHERE "a" < 100000 AND "b" = 200000;\n                                                       QUERY PLAN                                                       \n------------------------------------------------------------------------------------------------------------------------\n Index Scan using "Test_hash_b" on "Test"  (cost=0.00..12.04 rows=1 width=16) (actual time=0.039..0.040 rows=0 loops=1)\n   Index Cond: (b = 200000)\n   Filter: (a < 100000)\n Planning Time: 2.113 ms\n Execution Time: 0.082 ms\n(5 rows)\n```\n'}}]);