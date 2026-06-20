import { test, expect } from "@playwright/test";

/** Wait for lazy route chunks and i18n to settle. */
async function expectPageReady(page: import("@playwright/test").Page) {
  await expect(page.locator("#root")).toBeAttached();
  await page.waitForLoadState("domcontentloaded");
}

test.describe("Smoke — public routes (guest)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("app.locale", "zh");
      localStorage.setItem("onboarding.v1.done", "1");
    });
  });

  test("home / — hero and discovery section render", async ({ page }) => {
    await page.goto("/");
    await expectPageReady(page);

    await expect(page.getByRole("heading", { name: /Island AI/i })).toBeVisible();
    await expect(page.getByText("自我探索")).toBeVisible();
    await expect(page.getByText("今日求签")).toBeVisible();
  });

  test("chat /chat — conversation UI renders", async ({ page }) => {
    await page.goto("/chat");
    await expectPageReady(page);

    await expect(page.getByText("在线")).toBeVisible();
    await expect(page.getByPlaceholder("你在想什么…")).toBeVisible();
    await expect(page.getByText("登录后保存进度")).toBeVisible();
  });

  test("assessment hub /assessment — list renders", async ({ page }) => {
    await page.goto("/assessment");
    await expectPageReady(page);

    await expect(
      page.getByRole("heading", { name: "自我探索", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("性格测评 (MBTI)")).toBeVisible();
    await expect(page.getByText("九型人格")).toBeVisible();
  });

  test("MBTI /assessment/mbti — intro step renders", async ({ page }) => {
    await page.goto("/assessment/mbti");
    await expectPageReady(page);

    await expect(page.getByText("MBTI 性格测评")).toBeVisible();
    await expect(page.getByText("10 个场景，看看你是哪种人")).toBeVisible();
    await expect(page.getByRole("button", { name: "开始测评 ✨" })).toBeVisible();
  });

  test("Enneagram /assessment/enneagram — intro step renders", async ({ page }) => {
    await page.goto("/assessment/enneagram");
    await expectPageReady(page);

    await expect(page.getByText("九型人格测评")).toBeVisible();
    await expect(page.getByText("发现你的九型人格类型")).toBeVisible();
  });

  test("Zodiac /assessment/zodiac — sign picker renders", async ({ page }) => {
    await page.goto("/assessment/zodiac");
    await expectPageReady(page);

    await expect(page.getByText("选择你的星座")).toBeVisible();
    await expect(page.getByText("星盘入口")).toBeVisible();
  });

  test("compatibility /assessment/compatibility — first step without auth", async ({
    page,
  }) => {
    await page.goto("/assessment/compatibility");
    await expectPageReady(page);

    await expect(
      page.getByRole("heading", { name: "缘分配对", exact: true }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("你的代号 / 昵称")).toBeVisible();
    await expect(
      page.getByPlaceholder("叫 TA 什么都行～昵称、绰号、'前任'…"),
    ).toBeVisible();
  });

  test("auth /auth — login page renders", async ({ page }) => {
    await page.goto("/auth");
    await expectPageReady(page);

    await expect(page.getByPlaceholder("邮箱地址")).toBeVisible();
    await expect(page.getByPlaceholder("密码")).toBeVisible();
  });

  test("welcome /welcome — first-time onboarding renders", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("onboarding.v1.done");
    });
    await page.goto("/welcome");
    await expectPageReady(page);

    await expect(page.getByText("四位懂你的 AI 伙伴")).toBeVisible();
    await expect(page.getByRole("button", { name: "继续" })).toBeVisible();
  });

  test("home / — redirects new users to welcome", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("onboarding.v1.done");
    });
    await page.goto("/");
    await expectPageReady(page);

    await expect(page).toHaveURL("/welcome");
  });
});

test.describe("Smoke — auth-gated routes (guest behavior)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("app.locale", "zh");
      localStorage.setItem("onboarding.v1.done", "1");
    });
  });

  test("vault /vault — prompts login without crash", async ({ page }) => {
    await page.goto("/vault");
    await expectPageReady(page);

    await expect(page.getByText("正在跳转...")).toBeVisible();
    await expect(page.getByText("登录后查看你的收藏 ✨")).toBeVisible();
  });

  test("soul-map /soul-map — redirects guest to home", async ({ page }) => {
    await page.goto("/soul-map");
    await expectPageReady(page);

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /Island AI/i })).toBeVisible();
  });
});
