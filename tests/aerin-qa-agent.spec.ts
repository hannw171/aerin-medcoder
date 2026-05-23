import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const jsonPath = path.resolve(__dirname, '../src/lib/patients.json');

test.beforeEach(async ({ page }) => {
  // Disable Joyride tour so it does not block interactions
  await page.addInitScript(() => {
    window.localStorage.setItem('has_seen_tour', 'true');
  });

  // Restore specific patients we use in tests to a clean state
  if (fs.existsSync(jsonPath)) {
    try {
      const data = fs.readFileSync(jsonPath, 'utf8');
      const patients = JSON.parse(data);
      let changed = false;
      for (const p of patients) {
        if (p.id === 'p1' || p.id === 'p17' || p.id === 'p15') {
          p.status = 'Belum Coding';
          if (p.auditOverride !== undefined) {
            delete p.auditOverride;
            changed = true;
          }
          if (p.hasPenyulit !== undefined) {
            delete p.hasPenyulit;
            changed = true;
          }
          if (p.id === 'p15' && p.codingResult !== undefined) {
            delete p.codingResult;
            changed = true;
          }
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(jsonPath, JSON.stringify(patients, null, 2), 'utf8');
      }
    } catch (err) {
      console.error('Failed to reset database:', err);
    }
  }
});

test.describe('Aerin-MedCoder QA E2E Test Suite', () => {
  
  test('Test Case 1: Happy Path Coding', async ({ page }) => {
    // Intercept the AI generator API to return a clean coding result
    await page.route('**/api/generate-icd', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          icd10: ["I21.9", "I10"],
          icd9: ["88.72"],
          complianceAlerts: [],
          primaryDiagnosis: { code: "I21.9", description: "Acute myocardial infarction, unspecified" },
          secondaryDiagnoses: [
            { code: "I10", description: "Essential (primary) hypertension" }
          ],
          procedures: [
            { code: "88.72", description: "Diagnostic ultrasound of heart" }
          ],
          potentialFindings: []
        })
      });
    });

    // 1. Go to patient list
    await page.goto('/patient-list');

    // 2. Search Budi Santoso
    const searchInput = page.getByPlaceholder('Search RM or Name');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Budi Santoso');
    
    // 3. Click Code Now
    const codeNowLink = page.getByRole('link', { name: 'Code Now' });
    await expect(codeNowLink).toBeVisible();
    await codeNowLink.click();

    // 4. Click Generate ICD Codes
    const generateBtn = page.locator('#tour-coding-generate');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 5. Verify the generated code is shown
    await expect(page.locator('text=Acute myocardial infarction, unspecified')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=I21.9')).toBeVisible();

    // 6. Click Validasi & Simpan
    const saveBtn = page.getByRole('button', { name: 'Validasi & Simpan' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 7. Verify redirect back to patient-list and status updated to Selesai
    await expect(page).toHaveURL(/.*patient-list/, { timeout: 10000 });
    
    // Filter Budi Santoso again
    await searchInput.fill('Budi Santoso');
    
    // Verify status is Selesai
    const statusBadge = page.locator('span').filter({ hasText: 'Selesai' }).first();
    await expect(statusBadge).toBeVisible();
  });

  test('Test Case 2: PRB Leak Detection & Coder Override', async ({ page }) => {
    // Intercept the AI generator API with a PRB violation alert
    await page.route('**/api/generate-icd', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          icd10: ["E11.9", "I10"],
          icd9: ["99.18"],
          complianceAlerts: [
            {
              type: "Screening PRB",
              targetCode: "E11.9",
              isViolated: true,
              message: "Diabetes Mellitus tanpa komplikasi merupakan kompetensi dasar FKTP. Rujuk Balik ke FKTP jika kondisi stabil.",
              clarificationText: "Mohon konfirmasi DPJP..."
            }
          ],
          primaryDiagnosis: { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
          secondaryDiagnoses: [
            { code: "I10", description: "Essential (primary) hypertension" }
          ],
          procedures: [
            { code: "99.18", description: "Injection or infusion of other therapeutic or prophylactic substance" }
          ],
          potentialFindings: []
        })
      });
    });

    // 1. Go to patient list
    await page.goto('/patient-list');

    // 2. Search Ahmad Sanusi
    const searchInput = page.getByPlaceholder('Search RM or Name');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Ahmad Sanusi');

    // 3. Click Code Now
    const codeNowLink = page.getByRole('link', { name: 'Code Now' });
    await expect(codeNowLink).toBeVisible();
    await codeNowLink.click();

    // 4. Click Generate ICD Codes
    const generateBtn = page.locator('#tour-coding-generate');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 5. Verify compliance alert panel appears (Amber/Warning state)
    const alertPanel = page.locator('text=Diabetes Mellitus tanpa komplikasi merupakan kompetensi dasar FKTP');
    await expect(alertPanel).toBeVisible({ timeout: 15000 });

    // 6. Click Validasi & Simpan
    const saveBtn = page.getByRole('button', { name: 'Validasi & Simpan' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 7. Verify interceptor modal appears
    const modalHeader = page.locator('text=Catatan Kepatuhan Terdeteksi');
    await expect(modalHeader).toBeVisible();

    // 8. Click Tetap Simpan & Klaim RS (Ada Penyulit)
    const overrideBtn = page.locator('text=Tetap Simpan & Klaim RS (Ada Penyulit)');
    await expect(overrideBtn).toBeVisible();
    await overrideBtn.click();

    // 9. Verify redirect back to patient-list and status updated to Selesai
    await expect(page).toHaveURL(/.*patient-list/, { timeout: 10000 });

    // Search Ahmad Sanusi again
    await searchInput.fill('Ahmad Sanusi');
    
    // Verify status is Selesai
    const statusBadge = page.locator('span').filter({ hasText: 'Selesai' }).first();
    await expect(statusBadge).toBeVisible();

    // 10. Verify Audit Trail Log receives a new entry
    await page.goto('/audit-logs');
    await expect(page.locator('text=Ahmad Sanusi')).toBeVisible();
    await expect(page.locator('text=Screening PRB')).toBeVisible();
    await expect(page.locator('text=Disetujui: Ditemukan dokumen penyulit klinis sekunder')).toBeVisible();

    // 11. Go to dashboard and verify AI Accuracy rate drops to 80.0%
    await page.goto('/');
    await expect(page.locator('text=80.0%')).toBeVisible();
  });

  test('Test Case 3: Real-Time Reactive Resolution', async ({ page }) => {
    // Intercept the AI generator API with a Tips FAQ Casemix violation alert
    await page.route('**/api/generate-icd', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          icd10: ["Z09.0", "I10"],
          icd9: ["99.18"],
          complianceAlerts: [
            {
              type: "Tips FAQ Casemix",
              targetCode: "Z09.8",
              isViolated: true,
              message: "Bila dilakukan kontrol pasca prosedur, gunakan Z09.8 sebagai diagnosa utama.",
              clarificationText: "Mohon konfirmasi DPJP..."
            }
          ],
          primaryDiagnosis: { code: "Z09.0", description: "Follow-up examination after surgery" },
          secondaryDiagnoses: [
            { code: "I10", description: "Essential (primary) hypertension" }
          ],
          procedures: [
            { code: "99.18", description: "Injection or infusion of other therapeutic or prophylactic substance" }
          ],
          potentialFindings: []
        })
      });
    });

    // 1. Go to patient list
    await page.goto('/patient-list');

    // 2. Search Ahmad Sanusi
    const searchInput = page.getByPlaceholder('Search RM or Name');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Ahmad Sanusi');

    // 3. Click Code Now
    const codeNowLink = page.getByRole('link', { name: 'Code Now' });
    await expect(codeNowLink).toBeVisible();
    await codeNowLink.click();

    // 4. Click Generate ICD Codes
    const generateBtn = page.locator('#tour-coding-generate');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 5. Verify compliance alert panel appears (Amber/Warning state)
    const alertMessage = 'Bila dilakukan kontrol pasca prosedur, gunakan Z09.8 sebagai diagnosa utama';
    await expect(page.locator(`text=${alertMessage}`)).toBeVisible({ timeout: 15000 });

    // 6. Enter Revision Mode
    const revisiBtn = page.getByRole('button', { name: 'Revisi' });
    await expect(revisiBtn).toBeVisible();
    await revisiBtn.click();

    // 7. Click Edit on Primary Diagnosis
    const editBtn = page.locator('button').filter({ hasText: 'edit' }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 8. Type Z09.8 in input
    const primaryInput = page.getByPlaceholder('Cari diagnosa utama (ICD-10)...');
    await expect(primaryInput).toBeVisible();
    await primaryInput.fill('Z09.8');

    // 9. Wait for dropdown list option containing Z09.8 and click it
    const dropdownOption = page.locator('li').filter({ hasText: 'Z09.8' }).first();
    await expect(dropdownOption).toBeVisible({ timeout: 5000 });
    await dropdownOption.click();

    // Click "Simpan Perubahan" button to save the primary diagnosis code
    const saveChangesBtn = page.getByRole('button', { name: 'Simpan Perubahan' });
    await expect(saveChangesBtn).toBeVisible();
    await saveChangesBtn.click();

    // 10. Verify that the warning alert panel instantly reacts and switches to the Emerald/Green state ("Teratasi")
    await expect(page.getByText('Teratasi').first()).toBeVisible({ timeout: 5000 });
    
    // Verify that it has the check_circle icon showing resolved state
    const checkCircleIcon = page.locator('span').filter({ hasText: 'check_circle' }).first();
    await expect(checkCircleIcon).toBeVisible();
  });

  test('Test Case 4: Demographic Enforcement - Gender Restriction Breach', async ({ page }) => {
    // Intercept the AI generator API with a Gender restriction violation alert
    await page.route('**/api/generate-icd', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          icd10: ["O14.1", "I10"],
          icd9: ["99.18"],
          complianceAlerts: [
            {
              type: "Restriksi Gender",
              targetCode: "O14.1",
              isViolated: true,
              message: "Preeklamsia hanya terjadi pada kehamilan (pasien wanita).",
              clarificationText: "Mohon konfirmasi DPJP..."
            }
          ],
          primaryDiagnosis: { code: "O14.1", description: "Severe pre-eclampsia" },
          secondaryDiagnoses: [
            { code: "I10", description: "Essential (primary) hypertension" }
          ],
          procedures: [
            { code: "99.18", description: "Injection or infusion of other therapeutic or prophylactic substance" }
          ],
          potentialFindings: []
        })
      });
    });

    // 1. Go to patient list
    await page.goto('/patient-list');

    // 2. Search Budi Santoso (who is Male, gender: 'L')
    const searchInput = page.getByPlaceholder('Search RM or Name');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Budi Santoso');

    // 3. Click Code Now
    const codeNowLink = page.getByRole('link', { name: 'Code Now' });
    await expect(codeNowLink).toBeVisible();
    await codeNowLink.click();

    // 4. Click Generate ICD Codes to trigger AI analysis
    const generateBtn = page.locator('#tour-coding-generate');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // 5. Assert that compliance interceptor triggers a "Restriksi Gender" alert panel with an Amber warning state
    const alertMessage = "Preeklamsia hanya terjadi pada kehamilan (pasien wanita).";
    await expect(page.locator(`text=${alertMessage}`)).toBeVisible({ timeout: 15000 });

    const alertType = page.locator('span').filter({ hasText: 'Restriksi Gender' }).first();
    await expect(alertType).toBeVisible();

    // Assert Amber warning state (warning icon is visible)
    const warningIcon = page.locator('span').filter({ hasText: 'warning' }).first();
    await expect(warningIcon).toBeVisible();

    // 6. Assert that trying to save the record triggers the interceptor guardrail
    const saveBtn = page.getByRole('button', { name: 'Validasi & Simpan' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    const modalHeader = page.locator('text=Catatan Kepatuhan Terdeteksi');
    await expect(modalHeader).toBeVisible();
  });

  test('Test Case 5: Demographic Enforcement - Age Limit Constraint Validation', async ({ page }) => {
    // Intercept the AI generator API with a Batasan Usia compliance alert
    await page.route('**/api/generate-icd', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          icd10: ["H66.0", "I10"],
          icd9: ["99.18"],
          complianceAlerts: [
            {
              type: "Batasan Usia",
              targetCode: "O80.9",
              isViolated: false,
              message: "Persalinan normal hanya dapat diklaim untuk pasien usia produktif reproduksi. Pastikan usia pasien sesuai.",
              clarificationText: "Mohon konfirmasi DPJP..."
            }
          ],
          primaryDiagnosis: { code: "H66.0", description: "Acute suppurative otitis media" },
          secondaryDiagnoses: [
            { code: "I10", description: "Essential (primary) hypertension" }
          ],
          procedures: [
            { code: "99.18", description: "Injection or infusion of other therapeutic or prophylactic substance" }
          ],
          potentialFindings: []
        })
      });
    });

    // 1. Go to patient list
    await page.goto('/patient-list');

    // 2. Search Nita Talia (who is 2 years old)
    const searchInput = page.getByPlaceholder('Search RM or Name');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Nita Talia');

    // 3. Click Code Now
    const codeNowLink = page.getByRole('link', { name: 'Code Now' });
    await expect(codeNowLink).toBeVisible();
    await codeNowLink.click();

    // 4. Click Generate ICD Codes
    const generateBtn = page.locator('#tour-coding-generate');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Verify it is generated (no warning initially because primary code is H66.0, not O80.9)
    await expect(page.locator('text=Acute suppurative otitis media')).toBeVisible({ timeout: 15000 });

    // 5. Enter Revision Mode
    const revisiBtn = page.getByRole('button', { name: 'Revisi' });
    await expect(revisiBtn).toBeVisible();
    await revisiBtn.click();

    // 6. Click Edit on Primary Diagnosis
    const editBtn = page.locator('button').filter({ hasText: 'edit' }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 7. Inject geriatric code "O80.9" in input (using the search input field)
    const primaryInput = page.getByPlaceholder('Cari diagnosa utama (ICD-10)...');
    await expect(primaryInput).toBeVisible();
    await primaryInput.fill('O80.9');

    // 8. Wait for dropdown list option containing O80.9 and click it
    const dropdownOption = page.locator('li').filter({ hasText: 'O80.9' }).first();
    await expect(dropdownOption).toBeVisible({ timeout: 5000 });
    await dropdownOption.click();

    // Click "Simpan Perubahan" button to save the primary diagnosis code
    const saveChangesBtn = page.getByRole('button', { name: 'Simpan Perubahan' });
    await expect(saveChangesBtn).toBeVisible();
    await saveChangesBtn.click();

    // 9. Assert that the compliance interceptor instantly triggers a "Batasan Usia" alert panel highlighting the age mismatch criteria
    const alertMessage = "Persalinan normal hanya dapat diklaim untuk pasien usia produktif reproduksi. Pastikan usia pasien sesuai.";
    await expect(page.locator(`text=${alertMessage}`)).toBeVisible({ timeout: 10000 });

    const alertType = page.locator('span').filter({ hasText: 'Batasan Usia' }).first();
    await expect(alertType).toBeVisible();

    // Assert Amber warning state (warning icon is visible)
    const warningIcon = page.locator('span').filter({ hasText: 'warning' }).first();
    await expect(warningIcon).toBeVisible();

    // 10. Click Edit again to change back to a valid pediatric code
    await editBtn.click();

    // Fill back with H66.0
    await primaryInput.fill('H66.0');

    // Wait for dropdown option and click it
    const dropdownOptionPediatric = page.locator('li').filter({ hasText: 'H66.0' }).first();
    await expect(dropdownOptionPediatric).toBeVisible({ timeout: 5000 });
    await dropdownOptionPediatric.click();

    // Click "Simpan Perubahan"
    await saveChangesBtn.click();

    // 11. Assert that the alert panel transitions to the Emerald/Green ("Teratasi") state
    await expect(page.getByText('Teratasi').first()).toBeVisible({ timeout: 5000 });
    
    // Verify that it has the check_circle icon showing resolved state
    const checkCircleIcon = page.locator('span').filter({ hasText: 'check_circle' }).first();
    await expect(checkCircleIcon).toBeVisible();
  });
});
