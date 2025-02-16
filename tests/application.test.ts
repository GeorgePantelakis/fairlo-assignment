import { test } from "../fixtures/basePage"
import { expect } from '@playwright/test';
import { calculateChecksum } from "../utils/utils";
import { faker } from '@faker-js/faker';

// First sanity check
test('Check that app is online', async ({ applicationPage }) => {
  await expect(applicationPage).toHaveTitle(/Fairlo/);
});


// Second sanity check
test('Redirect to the form', async ({ applicationPage }) => {
  await applicationPage.getByLabel('Ansök nu').click()
  // Expect a title "to contain" a substring.
  await expect(applicationPage).toHaveTitle(/Fairlo/);
  await expect(applicationPage.getByText("Lite uppgifter om dig")).toBeVisible()
  await expect(applicationPage.locator("#personal-details-form")).toBeVisible()
});


// Fuzzing for the email
[
  {
    email: "test",
    isValid: false
  },
  {
    email: "test@",
    isValid: false
  },
  {
    email: "test@tester",
    isValid: false
  },
  {
    email: "test@tester.",
    isValid: false
  },
  {
    email: "test@.com",
    isValid: false
  },
  {
    email: "test@tester.com",
    isValid: true
  }
].forEach(({ email, isValid }) => {
  test(`Use ${email} to email field`, async ({ formPage }) => {
    await formPage.locator('#email').fill(email)
    if (isValid){
      await expect(formPage.locator("#email-error-message")).not.toBeVisible()
    } else {
      await expect(formPage.locator("#email-error-message")).toBeVisible()
    }
  });
});


// Fuzzing for the mobile number
var provideMobileMessage = "Vänligen fyll i ditt mobilnummer";
var toBigMobileMessage = "Vänligen fyll i 10 antal bokstäver";
[
  {
    mobileNumber: "0501020304",
    errorMessage: provideMobileMessage
  },
  {
    mobileNumber: "070102030",
    errorMessage: provideMobileMessage
  },
  {
    mobileNumber: "07010203045",
    errorMessage: toBigMobileMessage
  },
  {
    mobileNumber: "test",
    errorMessage: provideMobileMessage
  },
  {
    mobileNumber: "070i020304",
    errorMessage: provideMobileMessage
  },
  {
    mobileNumber: "testtesttest",
    errorMessage: toBigMobileMessage
  },
  {
    mobileNumber: "testtestte",
    errorMessage: provideMobileMessage
  },
  {
    mobileNumber: "0701020304",
    errorMessage: null
  }
].forEach(({ mobileNumber, errorMessage }) => {
  test(`Use ${mobileNumber} to Mobilenummer field`, async ({ formPage }) => {
    await formPage.locator('#mobile').fill(mobileNumber)
    if (errorMessage){
      await expect(formPage.locator("#mobile-error-message")).toBeVisible()
      await expect(formPage.locator("#mobile-error-message")).toContainText(errorMessage)
    } else {
      await expect(formPage.locator("#mobile-error-message")).not.toBeVisible()
    }
  });
});

// Fuzzing for the national number
[
  {
    // Invalid checksum
    nationalNumber: "199901010015",
    isValid: false
  },
  {
    // No checksum
    nationalNumber: "19990101001",
    isValid: false
  },
  {
    // One more number than expected
    nationalNumber: "1999010100180",
    isValid: false
  },
  {
    // Invalid checksum with hyphen
    nationalNumber: "19990101-0015",
    isValid: false
  },
  {
    // No checksum with hyphen
    nationalNumber: "19990101-001",
    isValid: false
  },
  {
    // One more number than expected with hyphen
    nationalNumber: "19990101-00180",
    isValid: false
  },
  {
    // Valid 12 digit number
    nationalNumber: "199901010018",
    isValid: true
  },
  {
    // Valid 10 digit number
    nationalNumber: "9901010018",
    isValid: true
  },
  {
    // Valid 12 digit number with hyphen
    nationalNumber: "19990101-0018",
    isValid: true
  },
  {
    // Valid 10 digit number with hyphen
    nationalNumber: "990101-0018",
    isValid: true
  }
].forEach(({ nationalNumber, isValid }) => {
  test(`Use ${nationalNumber} to nationalNumber field`, async ({ formPage }) => {
    await formPage.locator('#nationalNumber').fill(nationalNumber)
    if (isValid){
      await expect(formPage.locator("#nationalNumber-error-message")).not.toBeVisible()
    } else {
      await expect(formPage.locator("#nationalNumber-error-message")).toBeVisible()
    }
  });
});


[
  {
    birthDate: "20020101", // 23 years old
    isValid: false
  },
  {
    birthDate: "19990101", // 26 years old
    isValid: true
  },
  {
    birthDate: "19960101", // 29 years old
    isValid: true
  },
  {
    birthDate: "19950101", // over 30 years old
    isValid: false
  }
].forEach(({ birthDate, isValid }, i) => {
  var nameMobileNumber = "07" + faker.number.int({ min: 0, max: 999999 }).toString().padStart(6, "0")
  var nationalNumber = ""

  nationalNumber = birthDate + "210"
  nationalNumber += calculateChecksum(nationalNumber.substring(2)).toString()

  test(`Using ${nationalNumber} as national number and 30.000 Kr monthly income`, async ({ formPage }) => {
    // Fill the fields on the initial form
    await formPage.locator("#email").fill(faker.internet.email({ provider:"tester.com" }))
    await formPage.locator("#mobile").fill(nameMobileNumber + "01")
    await formPage.locator("#nationalNumber").fill(nationalNumber)

    // Click submit to move to the next page
    await formPage.locator("//button[@type='submit']").click({ delay: 1_000 })

    // From the radio group take the second one which is the Student
    await formPage.locator("ul > li").nth(1).click()
    expect(await formPage.locator("//input[@type='radio'][@value='Student']")).toBeChecked()

    // Click submit to move to the next page
    await formPage.locator("//button[@type='submit']").click({ delay: 1_000 })

    // Fill the fields of the income, for this test we are using 30.000 kr
    await formPage.locator("#monthlyIncome").fill("30000")
    await formPage.locator("#monthlyHouseCost").fill("0")
    await formPage.locator("#transportationCost").fill("0")
    await formPage.locator("#otherLoanCost").fill("0")

    // Click submit to move to the next page
    await formPage.locator("//button[@type='submit']").click({ delay: 1_000 })

    // Wait for up to 5 minutes to get to status page
    await formPage.waitForURL("**/status", { timeout: 300_000 })

    // Check if the application was approved or not
    if (isValid) {
      await expect(formPage.getByText("Grattis!")).toBeVisible()
    } else {
      await expect(formPage.getByText("Grattis!")).not.toBeVisible()
    }
  });

  nationalNumber = birthDate + "211"
  nationalNumber += calculateChecksum(nationalNumber.substring(2)).toString()

  test(`Using ${nationalNumber} as national number and 10.000 Kr monthly income`, async ({ formPage }) => {
    // Fill the fields on the initial form
    await formPage.locator("#email").fill(faker.internet.email({ provider:"tester.com" }))
    await formPage.locator("#mobile").fill(nameMobileNumber + "02")
    await formPage.locator("#nationalNumber").fill(nationalNumber)

    // Click submit to move to the next page
    await formPage.locator("//button[@type='submit']").click({ delay: 1_000 })

    // From the radio group take the second one which is the Student
    await formPage.locator("ul > li").nth(1).click()
    expect(await formPage.locator("//input[@type='radio'][@value='Student']")).toBeChecked()

    // Click submit to move to the next page
    await formPage.locator("//button[@type='submit']").click({ delay: 1_000 })

    // Fill the fields of the income, for this test we are using 10.000 kr
    await formPage.locator("#monthlyIncome").fill("10000")
    await formPage.locator("#monthlyHouseCost").fill("0")
    await formPage.locator("#transportationCost").fill("0")
    await formPage.locator("#otherLoanCost").fill("0")

    // Click submit to move to the next page
    await formPage.locator("//button[@type='submit']").click({ delay: 1_000 })

    // Wait for up to 5 minutes to get to status page
    await formPage.waitForURL("**/status", { timeout: 300_000 })

    // Check if the application was not approved because of small income
    await expect(formPage.getByText("Grattis!")).not.toBeVisible()
  });
});