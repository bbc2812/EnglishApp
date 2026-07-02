import { test, expect, Page } from '@playwright/test'

interface PageTest {
  name: string
  url: string
  checkContent?: (page: Page) => Promise<void>
  interactive?: (page: Page) => Promise<void>
}

const PAGES: PageTest[] = [
  {
    name: 'Dashboard',
    url: '/#/dashboard',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Good')
      expect(bodyText).toContain('Roadmap')
    },
  },
  {
    name: 'Flashcards',
    url: '/#/flashcards',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Flashcards')
    },
  },
  {
    name: 'Listening',
    url: '/#/listening?lesson=1',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Listening')
    },
  },
  {
    name: 'Reading',
    url: '/#/reading?lesson=2',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Reading')
    },
  },
  {
    name: 'Shadowing',
    url: '/#/shadowing',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Shadowing')
    },
    async interactive(page) {
      const drillBtn = page.locator('button').filter({ hasText: 'This' }).first()
      if (await drillBtn.isVisible()) {
        await drillBtn.click()
        await page.waitForTimeout(200)
      }
    },
  },
  {
    name: 'Speaking',
    url: '/#/speaking',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Speaking')
    },
    async interactive(page) {
      const promptBtn = page.locator('button').first()
      if (await promptBtn.isVisible()) {
        await promptBtn.click()
        await page.waitForTimeout(300)
      }
    },
  },
  {
    name: 'News',
    url: '/#/news',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('News')
    },
    async interactive(page) {
      await page.waitForTimeout(2000)
      const bbcTab = page.locator('button').filter({ hasText: 'BBC' }).first()
      if (await bbcTab.isVisible()) {
        await bbcTab.click()
        await page.waitForTimeout(500)
      }
    },
  },
  {
    name: 'YouTube',
    url: '/#/youtube',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('YouTube')
    },
  },
  {
    name: 'Podcasts',
    url: '/#/podcasts',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Podcasts')
    },
    async interactive(page) {
      await page.waitForTimeout(1500)
      const episodeBtn = page.locator('button').first()
      if (await episodeBtn.isVisible()) {
        await episodeBtn.click()
        await page.waitForTimeout(300)
      }
    },
  },
  {
    name: 'Settings',
    url: '/#/settings',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Settings')
    },
    async interactive(page) {
      const geminiBtn = page.locator('button').filter({ hasText: 'Gemini' })
      if (await geminiBtn.count() > 0) {
        await geminiBtn.first().click()
        await page.waitForTimeout(200)
      }
    },
  },
  {
    name: 'Stats',
    url: '/#/stats',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Learning Analytics')
    },
  },
  {
    name: 'Writing',
    url: '/#/writing',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Writing')
      expect(bodyText).toContain('Essays, grammar drills')
    },
    async interactive(page) {
      const mistakeTab = page.locator('button').filter({ hasText: 'Mistakes' }).first()
      if (await mistakeTab.isVisible()) {
        await mistakeTab.click()
        await page.waitForTimeout(200)
      }
    },
  },
  {
    name: 'My Learning',
    url: '/#/learning',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('My Learning')
    },
  },
  {
    name: 'Import',
    url: '/#/import',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Import')
    },
  },
  {
    name: 'AI Tutor',
    url: '/#/tutor',
    async checkContent(page) {
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('AI Tutor')
    },
  },
]

test.describe('Page Tests - All 15 Pages', () => {
  const results: { name: string; status: string; errors: string[]; bugs: string[] }[] = []

  for (const pageTest of PAGES) {
    test(`${pageTest.name} - ${pageTest.url}`, async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text()
          if (!text.includes('HMR') && !text.includes('WebSocket') && !text.includes('devtools') && !text.includes('Failed to load resource')) {
            consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
          }
        }
      })

      page.on('pageerror', (err) => {
        if (!err.message.includes('HMR') && !err.message.includes('WebSocket')) {
          consoleErrors.push(`[JS Error] ${err.message}`)
        }
      })

      await page.goto(pageTest.url)
      await page.waitForTimeout(2000)

      const bugs: string[] = []

      if (pageTest.checkContent) {
        try {
          await pageTest.checkContent(page)
        } catch (e: any) {
          bugs.push(`Content check failed: ${e.message.split('\n')[0]}`)
        }
      }

      if (pageTest.interactive) {
        try {
          await pageTest.interactive(page)
        } catch (e: any) {
          bugs.push(`Interactive check failed: ${e.message.split('\n')[0]}`)
        }
      }

      const errorBoundary = page.locator('h2').filter({ hasText: 'Something went wrong' })
      if (await errorBoundary.count() > 0) {
        const errorMsg = await page.locator('p').filter({ hasText: /is not defined|cannot access|undefined|null/i }).first().textContent()
        bugs.push(`Error boundary: ${errorMsg}`)
      }

      const hasConsoleErrors = consoleErrors.length > 0
      const hasBugs = bugs.length > 0
      const status = hasConsoleErrors || hasBugs ? 'FAIL' : 'PASS'

      if (status === 'FAIL') {
        console.log(`\n❌ ${pageTest.name}: ${consoleErrors.length} console errors, ${bugs.length} bugs`)
        consoleErrors.forEach(e => console.log(`   - ${e}`))
        bugs.forEach(b => console.log(`   - Bug: ${b}`))
      } else {
        console.log(`\n✅ ${pageTest.name}: PASS`)
      }

      results.push({ name: pageTest.name, status, errors: consoleErrors, bugs })
    })
  }

  test('Final Summary', async () => {
    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    const allErrors = results.flatMap(r => r.errors)
    const allBugs = results.flatMap(r => r.bugs)

    console.log('\n\n========== FINAL SUMMARY ==========')
    console.log(`Pages tested: ${results.length}/15`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Console errors: ${allErrors.length}`)
    console.log(`Bugs found: ${allBugs.length}`)

    if (allBugs.length > 0) {
      console.log('\n--- Bugs Found ---')
      allBugs.forEach(b => console.log(`  - ${b}`))
    }

    console.log('\n---RESULTS_JSON---')
    console.log(JSON.stringify(results, null, 2))

    if (failed > 0) {
      test.fail()
    }
  })
})
