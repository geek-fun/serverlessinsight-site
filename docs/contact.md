---
title: "联系我们"
description: "ServerlessInsight 的联系方式：技术支持、商务合作、账单与退款咨询，以及开源社区入口。"
---
<script setup>
import {CONSOLE_URL} from './.vitepress/theme/console'
import {ICP_NUMBER, ICP_URL, SITE_URL_CN, SITE_URL_INTL} from './.vitepress/theme/compliance'
import {isCnLine} from './.vitepress/theme/site-line'

const siteUrl = isCnLine ? SITE_URL_CN : SITE_URL_INTL
</script>

# 联系我们

## 支持与咨询

| 事项 | 联系方式 | 响应时效 |
| --- | --- | --- |
| 技术支持、配置与部署问题 | support@wentsen.com | 2–5 个工作日 |
| 充值、扣款、发票、退款等账单问题 | support@wentsen.com | 3 个工作日内 |
| 商务合作、企业方案 | support@wentsen.com | 2–5 个工作日 |
| 安全问题报告 | support@wentsen.com | 1 个工作日内确认 |

邮件请尽量附上：问题描述、相关配置片段、错误信息与复现步骤。涉及账单时请提供账号邮箱与订单号，便于快速定位。

## 开源社区

产品核心能力开源，欢迎通过 GitHub 参与：

- 仓库：https://github.com/geek-fun/serverlessinsight
- 问题反馈与新功能建议：https://github.com/geek-fun/serverlessinsight/issues

## 运营主体与备案

本网站由 ServerlessInsight 团队运营。

<ul>
  <li v-if="isCnLine">ICP 备案号：<a :href="ICP_URL" target="_blank" rel="noopener noreferrer">{{ ICP_NUMBER }}</a></li>
  <li>站点：<a :href="siteUrl">{{ siteUrl }}</a></li>
  <li>控制台：<a :href="CONSOLE_URL">{{ CONSOLE_URL }}</a></li>
</ul>

## 更多入口

- [支持服务](/support.html) — 完整的支持渠道与问题反馈指引
- [常见问题](/faq.html) — 配置、部署与计费的高频问题
- [退款政策](/refund-policy.html) — 退款条件与处理流程
