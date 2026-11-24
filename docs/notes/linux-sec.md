---
title: Linux ACL 与国密命令速查
description: POSIX ACL 权限控制、OpenSSL SM3/SM4 加解密、归档完整性校验与零宽字符编解码脚本
---

# Linux ACL 与国密命令速查

## 一、POSIX ACL 精细权限控制

当传统的 `rwx`（属主 / 属组 / 其他人）不足以针对单个用户或特定审计账号单独授权时，使用 `getfacl` 与 `setfacl`：

```bash
# 查看现有 ACL 规则
getfacl target.csv

# 收紧基础权限（移除 others 权限）
chmod 640 target.csv

# 为指定用户单独授予只读权限
setfacl -m u:auditor:r-- target.csv

# 显式拒绝指定用户访问
setfacl -m u:guest:--- target.csv

# 移除指定用户的扩展 ACL 条目 / 清空全部扩展 ACL
setfacl -x u:guest target.csv
setfacl -b target.csv
```

> 修改基础 `chmod` 后需再核对 `getfacl` 输出中的 `mask::` 行，确认没有意外限制已配置的扩展权限。

---

## 二、OpenSSL 国密 SM3 / SM4 常用命令

OpenSSL 3.x 默认内置国密摘要与对称加密算法：

```bash
# 确认算法可用性
openssl list -digest-algorithms | grep -i sm3
openssl list -cipher-algorithms | grep -i sm4

# 计算文件 SM3 摘要
openssl dgst -sm3 plain.txt

# 使用 SM4-CBC 加密与解密（PBKDF2 密钥派生）
openssl enc -sm4-cbc -pbkdf2 -salt -in plain.txt -out cipher.bin
openssl enc -d -sm4-cbc -pbkdf2 -in cipher.bin -out decrypted.txt
```

非交互式传口令（用于脚本测试）可加 `-pass pass:your_passphrase`。

---

## 三、归档与 SHA-256 完整性校验

```bash
# 打包并生成校验文件
tar -czf backup_$(date +%F).tar.gz data_dir/
sha256sum backup_$(date +%F).tar.gz > SHA256SUMS

# 校验归档完整性
sha256sum -c SHA256SUMS
```

---

## 四、Unicode 零宽字符编码与提取

零宽字符常用于文本隐写或轻量级溯源水印，典型做法是将 UTF-8 字节序列按二进制展开，分别映射到 `\u200b`（Zero Width Space，表示 `1`）与 `\u200c`（Zero Width Non-Joiner，表示 `0`）：

```python
def encode_zw(text: str) -> str:
    bits = "".join(f"{b:08b}" for b in text.encode("utf-8"))
    return "".join("\u200b" if bit == "1" else "\u200c" for bit in bits)


def decode_zw(text: str) -> str:
    bits = "".join(
        "1" if ch == "\u200b" else "0"
        for ch in text
        if ch in ("\u200b", "\u200c")
    )
    if not bits:
        return ""
    usable = len(bits) - (len(bits) % 8)
    data = bytes(int(bits[i : i + 8], 2) for i in range(0, usable, 8))
    return data.decode("utf-8", errors="replace")
```

排查文本中是否混入零宽字符时，命令行可用 `cat -A file.txt` 或 Python 打印 `repr()` 直接定位非打印码点。
