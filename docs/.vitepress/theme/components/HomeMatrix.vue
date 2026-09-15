<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'

const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))

/* facts mirror docs/reference.md capability matrix — keep in sync */
const VENDORS = computed(() =>
  isZh.value
    ? [
        {
          key: 'aliyun',
          icon: '/icons/platform-aliyun.png',
          name: '阿里云',
          caps: [
            {t: '函数计算 FC3'},
            {t: '对象存储 OSS'},
            {t: 'API 网关'},
            {t: 'RDS · ES Serverless 数据库'},
            {t: '表格存储 TableStore'},
            {t: '自定义域名 · CDN'}
          ]
        },
        {
          key: 'tencent',
          icon: '/icons/platform-tencent.png',
          name: '腾讯云',
          caps: [
            {t: '云函数 SCF'},
            {t: '对象存储 COS'},
            {t: '函数 URL 触发器', sup: 1},
            {t: 'TDSQL-C · ES Serverless 数据库'},
            {t: '自定义域名 · DNSPod'}
          ]
        },
        {
          key: 'volcengine',
          icon: '/icons/platform-volcengine.png',
          name: '火山引擎',
          caps: [
            {t: '函数服务 VeFaaS'},
            {t: '对象存储 TOS'},
            {t: 'API 网关'},
            {t: '自定义域名 · 仅 APIGW'},
            {t: '数据库 / 表格存储', na: true, sup: 2}
          ]
        }
      ]
    : [
        {
          key: 'aliyun',
          icon: '/icons/platform-aliyun.png',
          name: 'Aliyun',
          caps: [
            {t: 'Function compute FC3'},
            {t: 'Object storage OSS'},
            {t: 'API Gateway'},
            {t: 'RDS · ES Serverless databases'},
            {t: 'TableStore tables'},
            {t: 'Custom domain · CDN'}
          ]
        },
        {
          key: 'tencent',
          icon: '/icons/platform-tencent.png',
          name: 'Tencent Cloud',
          caps: [
            {t: 'Cloud functions SCF'},
            {t: 'Object storage COS'},
            {t: 'Function URL triggers', sup: 1},
            {t: 'TDSQL-C · ES Serverless databases'},
            {t: 'Custom domain · DNSPod'}
          ]
        },
        {
          key: 'volcengine',
          icon: '/icons/platform-volcengine.png',
          name: 'Volcengine',
          caps: [
            {t: 'VeFaaS functions'},
            {t: 'Object storage TOS'},
            {t: 'API Gateway'},
            {t: 'Custom domain · APIGW only'},
            {t: 'Databases / table storage', na: true, sup: 2}
          ]
        }
      ]
)

const T = computed(() =>
  isZh.value
    ? {
        title: '一份配置，多云部署',
        lead: '切换部署目标只是换一个字段：provider.name。运行时标识自动映射为各云原生值，能力差异如实标注——支持的云厂商随版本持续增加。',
        f1: '腾讯云没有独立网关资源，HTTP 入口由函数 URL 触发器提供。',
        f2: '火山引擎暂不支持数据库与表格存储。',
        note: 'si local 目前支持阿里云，si plan 暂不支持火山引擎——命令级差异见配置手册。华为云 / AWS 暂不可部署，配置枚举与 Terraform 模板生成已就绪。',
        refLink: '查看完整支持矩阵',
        refHref: '/reference'
      }
    : {
        title: 'One configuration, deploy across clouds',
        lead: 'Switching deploy targets is one field: provider.name. Runtime identifiers map to each platform\u2019s native values — differences are stated honestly, and supported clouds keep growing with each release.',
        f1: 'Tencent Cloud has no standalone gateway resource; HTTP entry is served by function URL triggers.',
        f2: 'Databases and table storage are not yet available on Volcengine.',
        note: 'si local currently supports Aliyun and si plan is unavailable on Volcengine — see the reference for command-level differences. Huawei Cloud / AWS are not yet deployable; their config enums and Terraform template generation are in place.',
        refLink: 'Full support matrix',
        refHref: '/reference'
      }
)
</script>

<template>
  <section class="mx si-landing">
    <div class="si-wrap">
      <h2 class="sec-title">{{ T.title }}</h2>
      <p class="sec-lead">{{ T.lead }}</p>

      <div class="vendor-grid">
        <article v-for="v in VENDORS" :key="v.key" class="vendor-card">
          <header class="vendor-card__head">
            <img :src="v.icon" alt="" />
            <h3 class="vendor-card__name">{{ v.name }}</h3>
          </header>
          <ul class="vendor-card__caps">
            <li v-for="cap in v.caps" :key="cap.t" :class="{'is-na': cap.na}">
              {{ cap.t }}<sup v-if="cap.sup">{{ cap.sup }}</sup>
            </li>
          </ul>
        </article>
      </div>

      <ol class="fnotes">
        <li>{{ T.f1 }}</li>
        <li>{{ T.f2 }}</li>
      </ol>
      <p class="mx-note">{{ T.note }}</p>

      <a class="sec-link" :href="isZh ? T.refHref : `/en${T.refHref}`">{{ T.refLink }}<span class="sec-link__arrow">→</span></a>
    </div>
  </section>
</template>

<style scoped>
.mx {
  padding-top: clamp(72px, 11vh, 120px);
}

.mx .sec-lead {
  margin-bottom: 40px;
}

.vendor-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.vendor-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  padding: 24px;
  background: var(--vp-c-bg);
}

.vendor-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.vendor-card__head img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.vendor-card__name {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--vp-c-text-1);
}

.vendor-card__caps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vendor-card__caps li {
  position: relative;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.vendor-card__caps li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 7px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  opacity: 0.75;
}

.vendor-card__caps li.is-na {
  color: var(--vp-c-text-3);
}

.vendor-card__caps li.is-na::before {
  background: var(--vp-c-text-3);
  opacity: 0.5;
}

.vendor-card__caps li sup {
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  color: var(--vp-c-brand-1);
  margin-left: 2px;
}

.fnotes {
  margin: 24px 0 0;
  padding-left: 20px;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--vp-c-text-3);
}

.mx-note {
  margin: 10px 0 0;
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--vp-c-text-3);
}

.fnotes,
.mx-note {
  max-width: 76ch;
}

@media (max-width: 960px) {
  .vendor-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 761px) and (max-width: 960px) {
  .vendor-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .vendor-card__caps li {
    font-size: 12px;
  }
}
</style>
