import {test as base} from "@playwright/test"
import { Page } from "@playwright/test"

export const test = base.extend<{
    applicationPage: Page;
    formPage: Page;
}>({
    // Define fixtures
    applicationPage: async ({ page }, use) => {
        await page.goto('https://testapp.fairlo.se/application/');
        await page.waitForLoadState('domcontentloaded');
        await(use(page));
    },
    formPage: async ({ page }, use) => {
        await page.goto('https://testapp.fairlo.se/application/personal-details');
        await page.waitForLoadState('domcontentloaded');
        await(use(page));
    }
})