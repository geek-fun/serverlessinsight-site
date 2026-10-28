<script setup lang="ts">
import {computed, inject, nextTick, onUnmounted, ref} from 'vue'
import {useData} from 'vitepress'
import {animateContentChange} from '../motion.mjs'
import ThemeIcon from './ThemeIcon.vue'
import LandingSections from './LandingSections.vue'
import {CONSOLE_LOGIN_URL} from '../console'
import {CONFIGURATION, CONFIGURATION_LINES, EN, INSTALL_COMMAND, ZH} from '../landing-content'

const {page} = useData()
const isZh = computed(() => !page.value.relativePath.startsWith('en/'))
const t = computed(() => (isZh.value ? ZH : EN))
const link = (name: string) => `${isZh.value ? '/' : '/en/'}${name}.html`
type Tab = 'configuration' | 'plan'
const activeTab = ref<Tab>('plan')
const replayWorkflow = inject<() => void>('si-replay-workflow', () => {})
const replay = () => {
  selectTab('plan')
  replayWorkflow()
}
const configurationTab = ref<HTMLButtonElement | null>(null)
const planTab = ref<HTMLButtonElement | null>(null)
let tabAnimation: Animation | null = null
let tabRevision = 0
const selectTab = async (tab: Tab, focus = false) => {
  const changed = activeTab.value !== tab
  const current = ++tabRevision
  activeTab.value = tab
  await nextTick()
  if (current !== tabRevision) return
  if (changed) {
    tabAnimation?.cancel()
    tabAnimation = animateContentChange(document.getElementById(`${tab}-panel`))
  }
  if (focus) {
    const target = tab === 'configuration' ? configurationTab : planTab
    target.value?.focus()
  }
}
const onTabKeydown = (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const tab =
    event.key === 'Home'
      ? 'configuration'
      : event.key === 'End'
        ? 'plan'
        : activeTab.value === 'plan'
          ? 'configuration'
          : 'plan'
  selectTab(tab, true)
}

const copyStatus = ref<{key: string; failed: boolean} | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | undefined
const copyText = async (key: string, text: string) => {
  let failed = false
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    failed = true
  }
  copyStatus.value = {key, failed}
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyStatus.value = null
  }, 4000)
}
onUnmounted(() => {
  ++tabRevision
  clearTimeout(copyTimer)
  tabAnimation?.cancel()
})
const copyMessage = computed(() =>
  copyStatus.value ? (copyStatus.value.failed ? t.value.copyFailed : t.value.copied) : ''
)
const resourceIcons = ['code', 'network', 'database', 'bucket']
const providers = ['aliyun', 'tencent', 'volcengine']
</script>

<template>
  <div class="si-landing-page">
    <section id="platform" class="si-hero" aria-labelledby="landing-title">
      <div class="si-container si-hero__grid">
        <div class="si-hero__copy">
          <p class="si-eyebrow">{{ t.eyebrow }}</p>
          <h1 id="landing-title" class="si-hero__title" :class="{'si-hero__title--zh': isZh}" :aria-label="t.title">
            <span v-for="line in t.titleLines" :key="line">{{ line }} </span>
          </h1>
          <p class="si-hero__subtitle">{{ t.subtitle }}</p>
          <div class="si-hero__actions">
            <a class="si-button si-button--primary" :href="CONSOLE_LOGIN_URL"
              >{{ t.start }}<ThemeIcon name="arrow-right" :size="19"
            /></a>
            <a class="si-button si-button--secondary" :href="link('docs')"
              >{{ t.docs }}<ThemeIcon name="arrow-up-right" :size="17"
            /></a>
          </div>
          <p class="si-trust">
            <span>{{ t.trust }}</span
            ><span aria-hidden="true">·</span><span>{{ t.ownership }}</span>
          </p>
          <div class="si-install">
            <span class="si-install__prompt" aria-hidden="true">$</span><code>{{ INSTALL_COMMAND }}</code>
            <button
              class="si-icon-button"
              type="button"
              :aria-label="t.copyInstall"
              :title="t.copyInstall"
              @click="copyText('install', INSTALL_COMMAND)"
            >
              <ThemeIcon :name="copyStatus?.key === 'install' && !copyStatus.failed ? 'check' : 'copy'" :size="18" />
            </button>
          </div>
          <p v-if="copyStatus?.key === 'install'" class="si-copy-feedback" role="status">{{ copyMessage }}</p>
        </div>

        <div class="si-deployment">
          <div class="si-deployment__heading">
            <h2>{{ t.panelTitle }}</h2>
            <span>{{ t.illustration }}</span>
          </div>
          <div class="si-tabs" role="tablist" :aria-label="t.illustration" @keydown="onTabKeydown">
            <button
              id="configuration-tab"
              ref="configurationTab"
              role="tab"
              type="button"
              :aria-selected="activeTab === 'configuration'"
              aria-controls="configuration-panel"
              :tabindex="activeTab === 'configuration' ? 0 : -1"
              @click="selectTab('configuration')"
            >
              {{ t.configuration }}
            </button>
            <button
              id="plan-tab"
              ref="planTab"
              role="tab"
              type="button"
              :aria-selected="activeTab === 'plan'"
              aria-controls="plan-panel"
              :tabindex="activeTab === 'plan' ? 0 : -1"
              @click="selectTab('plan')"
            >
              {{ t.plan }}
            </button>
          </div>
          <div class="si-deployment__body">
            <div
              id="plan-panel"
              v-show="activeTab === 'plan'"
              class="si-plan-panel"
              role="tabpanel"
              aria-labelledby="plan-tab"
              tabindex="0"
            >
              <p class="si-plan__context">hello-world-api / production</p>
              <p class="si-plan__command"><span aria-hidden="true">$ </span><code>si deploy --stage prod</code></p>
              <table class="si-plan-table">
                <caption class="si-sr-only">
                  {{
                    t.plan
                  }}
                  —
                  {{
                    t.example
                  }}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{{ t.resource }}</th>
                    <th scope="col">{{ t.type }}</th>
                    <th scope="col">{{ t.change }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row"><span aria-hidden="true">+</span><code>hello_world_fn</code></th>
                    <td>{{ t.function }}</td>
                    <td>{{ t.create }}</td>
                  </tr>
                  <tr>
                    <th scope="row"><span aria-hidden="true">+</span><code>gateway_event</code></th>
                    <td>{{ t.gateway }}</td>
                    <td>{{ t.create }}</td>
                  </tr>
                  <tr>
                    <th scope="row"><span aria-hidden="true">=</span><code>assets</code></th>
                    <td>{{ t.storage }}</td>
                    <td>{{ t.unchanged }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="si-plan__summary">
                <span>{{ t.added }}</span
                ><span>{{ t.modified }}</span
                ><span>{{ t.removed }}</span>
              </p>
              <p class="si-plan__confirm">{{ t.proceed }}<span class="si-terminal-cursor" aria-hidden="true" /></p>
            </div>
            <div
              id="configuration-panel"
              v-show="activeTab === 'configuration'"
              class="si-configuration-panel"
              role="tabpanel"
              aria-labelledby="configuration-tab"
              tabindex="0"
            >
              <p class="si-plan__context">serverlessinsight.yml</p>
              <pre
                class="si-dark-code"
              ><code><template v-for="(line, i) in CONFIGURATION_LINES" :key="i"><span class="si-code-key">{{ line.key }}</span>{{ line.value }}{{ i < CONFIGURATION_LINES.length - 1 ? '\n' : '' }}</template></code></pre>
            </div>
            <div class="si-topology" role="group" :aria-label="t.topology">
              <div>
                <ThemeIcon name="network" :size="31" /><span>{{ t.gatewayLabel }}</span>
              </div>
              <span class="si-topology__connection" aria-hidden="true">
                <ThemeIcon name="arrow-right" class="si-topology__arrow" :size="24" />
                <ThemeIcon name="arrow-right" class="si-topology__trace" :size="24" />
              </span>
              <div>
                <ThemeIcon name="code" :size="31" /><span>{{ t.functionLabel }}</span>
              </div>
              <span class="si-topology__connection" aria-hidden="true">
                <ThemeIcon name="arrow-right" class="si-topology__arrow" :size="24" />
                <ThemeIcon name="arrow-right" class="si-topology__trace" :size="24" />
              </span>
              <div>
                <ThemeIcon name="database" :size="31" /><span>{{ t.storageLabel }}</span>
              </div>
            </div>
            <div class="si-deployment__footer">
              <button class="si-workflow-replay" type="button" @click="replay">
                <ThemeIcon name="replay" :size="15" />{{ t.replay }}
              </button>
              <p class="si-deployment__note">{{ t.panelNote }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="cloud-support" class="si-clouds" :aria-label="t.deployTo">
      <div class="si-container si-clouds__inner">
        <div class="si-clouds__row">
          <p class="si-eyebrow">{{ t.deployTo }}</p>
          <ul class="si-provider-list">
            <li v-for="(provider, i) in providers" :key="provider">
              <svg
                v-if="provider === 'aliyun'"
                class="si-provider-mark"
                width="36"
                height="30"
                viewBox="0 0 40 28"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                aria-hidden="true"
              >
                <path
                  d="M14 5H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h7M26 5h7a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-7M15 14h10"
                /></svg
              ><img v-else :src="`/icons/platform-${provider}.png`" width="36" height="30" alt="" /><span>{{
                t.clouds[i]
              }}</span>
            </li>
          </ul>
          <a class="si-text-link" :href="`${link('reference')}#provider`"
            >{{ t.cloudSupport }}<ThemeIcon name="arrow-up-right" :size="16"
          /></a>
        </div>
        <p class="si-clouds__note">{{ t.cloudNote }}</p>
      </div>
    </section>

    <LandingSections>
      <template #configuration>
        <section id="stack" class="si-stack" aria-labelledby="stack-title">
          <div class="si-container si-stack__grid">
            <div class="si-stack__copy">
              <p class="si-eyebrow">{{ t.configurationEyebrow }}</p>
              <h2 id="stack-title">{{ t.stackTitle }}</h2>
              <p class="si-stack__lead">{{ t.stackLead }}</p>
              <ul class="si-resource-list">
                <li v-for="(label, i) in t.resourceLabels" :key="label">
                  <ThemeIcon :name="resourceIcons[i]" :size="30" /><span>{{ label }}</span>
                </li>
              </ul>
              <a class="si-text-link" :href="link('reference')"
                >{{ t.configurationReference }}<ThemeIcon name="arrow-up-right" :size="17"
              /></a>
            </div>
            <figure class="si-code-example">
              <div class="si-code-window">
                <div class="si-code-window__header">
                  <span>serverlessinsight.yml</span><span class="si-code-window__label">{{ t.example }}</span
                  ><button
                    class="si-icon-button"
                    type="button"
                    :aria-label="t.copyConfiguration"
                    :title="t.copyConfiguration"
                    @click="copyText('configuration', CONFIGURATION)"
                  >
                    <ThemeIcon
                      :name="copyStatus?.key === 'configuration' && !copyStatus.failed ? 'check' : 'copy'"
                      :size="17"
                    />
                  </button>
                </div>
                <pre
                  class="si-light-code"
                ><code><span v-for="(line, i) in CONFIGURATION_LINES" :key="i" class="si-code-line"><span class="si-line-number" aria-hidden="true">{{ i + 1 }}</span><span><span class="si-code-key">{{ line.key }}</span>{{ line.value }}{{ i < CONFIGURATION_LINES.length - 1 ? '\n' : '' }}</span></span></code></pre>
              </div>
              <figcaption>{{ copyStatus?.key === 'configuration' ? copyMessage : t.exampleCaption }}</figcaption>
              <span v-if="copyStatus?.key === 'configuration'" class="si-sr-only" role="status">{{ copyMessage }}</span>
            </figure>
          </div>
        </section>
      </template>
      <template #workflow>
        <section class="si-workflow" aria-labelledby="workflow-title">
          <div class="si-container">
            <div class="si-section-heading">
              <h2 id="workflow-title">{{ t.workflowTitle }}</h2>
              <p>{{ t.workflowLead }}</p>
            </div>
            <ol class="si-workflow__steps">
              <li v-for="(step, i) in t.steps" :key="step.command">
                <span class="si-step-number" aria-hidden="true">0{{ i + 1 }}</span>
                <h3>
                  <code>{{ step.command }}</code>
                </h3>
                <p>{{ step.description }}</p>
              </li>
            </ol>
            <a class="si-text-link si-workflow__link" :href="link('cli')"
              >{{ t.cliReference }}<ThemeIcon name="arrow-right" :size="18"
            /></a>
          </div>
        </section>
      </template>
    </LandingSections>

    <section class="si-close" aria-labelledby="close-title">
      <div class="si-container si-close__grid">
        <div>
          <h2 id="close-title">{{ t.closeTitle }}</h2>
          <p>{{ t.closeLead }}</p>
        </div>
        <div class="si-close__actions">
          <a class="si-button si-button--primary" :href="CONSOLE_LOGIN_URL"
            >{{ t.start }}<ThemeIcon name="arrow-right" :size="19" /></a
          ><a class="si-text-link" :href="link('pricing')"
            >{{ t.pricing }}<ThemeIcon name="arrow-up-right" :size="17"
          /></a>
          <p>{{ t.license }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
