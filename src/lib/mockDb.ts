export interface Patient {
  id: string;
  registerNo: string;
  rmNo: string;
  name: string;
  bpjsClass: string;
  dpjp: string;
  dischargeDate: string;
  status: 'Belum Coding' | 'Draft AI' | 'Selesai' | 'Direvisi';
  medicalRecord: {
    anamnesa: string;
    ttv: {
      td: string;
      nadi: string;
      rr: string;
      suhu: string;
      spo2: string;
      nyeri: string;
    };
    physicalExam: string;
    labResult: string;
    radiologyResult: string;
    procedures: string[];
    inpatientMeds: string[];
    dischargeMeds: string[];
    diagnosisKlinisUtama: string;
    diagnosisKlinisSekunder: string;
  };
  codingResult?: {
    primaryDiagnosis: { id: string; code: string; description: string; insight?: string } | null;
    secondaryDiagnoses: { id: string; code: string; description: string; insight?: string }[];
    procedures: { id: string; code: string; description: string; insight?: string }[];
    potentialFindings?: { description: string; insight: string }[];
  };
}

// Initial hardcoded data as fallback
const initialPatients: Patient[] = [
  {
    "id": "p1",
    "registerNo": "2023001",
    "rmNo": "01-22-33",
    "name": "Budi Santoso",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Andi, Sp.PD",
    "dischargeDate": "2023-10-25",
    "status": "Belum Coding",
    "medicalRecord": {
      "anamnesa": "Pasien datang dengan keluhan kelemahan anggota gerak sebelah kanan sejak 2 jam SMRS. Pasien juga mengeluh bicara pelo dan sakit kepala. Riwayat hipertensi sejak 5 tahun lalu tidak terkontrol.",
      "ttv": {
        "td": "180/100",
        "nadi": "98",
        "rr": "20",
        "suhu": "36.8",
        "spo2": "97",
        "nyeri": "2"
      },
      "physicalExam": "Kesadaran compos mentis, GCS 15. Hemiparese dextra, kekuatan motorik ekstremitas atas 2/5, bawah 2/5. Parese N. VII, XII dextra sentral.",
      "labResult": "GDS: 145 mg/dL, Hb: 13.5 g/dL, Leukosit: 8500/uL, Trombosit: 250000/uL, Ureum: 30 mg/dL, Kreatinin: 1.0 mg/dL.",
      "radiologyResult": "CT Scan Kepala Non-Kontras: Tampak lesi hipodens di capsula interna sinistra, sesuai dengan gambaran infark serebri.",
      "procedures": [
        "CT Scan Kepala Non-Kontras",
        "Pemasangan IV line",
        "Pemasangan Kateter Urine"
      ],
      "inpatientMeds": [
        "Citicolin 2x500mg IV",
        "Amlodipine 1x10mg PO",
        "Aspilets 1x80mg PO"
      ],
      "dischargeMeds": [
        "Citicolin 2x500mg PO",
        "Amlodipine 1x10mg PO",
        "Aspilets 1x80mg PO"
      ],
      "diagnosisKlinisUtama": "Stroke Non Hemoragik (SNH)",
      "diagnosisKlinisSekunder": "Hipertensi Grade II"
    }
  },
  {
    "id": "p2",
    "registerNo": "2023002",
    "rmNo": "01-22-34",
    "name": "Siti Aminah",
    "bpjsClass": "Kelas 2",
    "dpjp": "Dr. Sarah, Sp.A",
    "dischargeDate": "2023-10-24",
    "status": "Draft AI",
    "medicalRecord": {
      "anamnesa": "Demam sejak 4 hari SMRS, demam naik turun. Disertai mual, muntah 2x, dan nyeri perut. Mimisan tidak ada, gusi berdarah tidak ada.",
      "ttv": {
        "td": "100/70",
        "nadi": "110",
        "rr": "22",
        "suhu": "38.5",
        "spo2": "98",
        "nyeri": "4"
      },
      "physicalExam": "Compos mentis, tampak sakit sedang. Rumple leede (+). Abdomen: nyeri tekan epigastrium (+), hepatomegali 1 jari bawah arcus costae. Akral hangat, CRT < 2 detik.",
      "labResult": "Hb: 14.2 g/dL, Ht: 45%, Leukosit: 2500/uL, Trombosit: 85000/uL, SGOT: 120 U/L, SGPT: 150 U/L. NS1 (+).",
      "radiologyResult": "Rontgen Thorax: tidak tampak efusi pleura. USG Abdomen: penebalan dinding vesica fellea, minimal ascites.",
      "procedures": [
        "Pemasangan IV line",
        "Pengambilan darah vena"
      ],
      "inpatientMeds": [
        "IVFD RL 1500cc/24 jam",
        "Paracetamol infus 3x500mg",
        "Ondansetron 3x4mg IV"
      ],
      "dischargeMeds": [
        "Paracetamol 3x500mg PO (k/p demam)",
        "Domperidone 3x10mg PO"
      ],
      "diagnosisKlinisUtama": "Dengue Haemorrhagic Fever (DHF) Grade II",
      "diagnosisKlinisSekunder": "Hepatitis Reaktif"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "A91",
        "description": "Dengue haemorrhagic fever",
        "insight": "Based on clinical evidence of fever, positive NS1, and thrombocytopenia."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "K75.9",
          "description": "Inflammatory liver disease, unspecified",
          "insight": "Indicated by elevated SGOT/SGPT and hepatomegaly."
        }
      ],
      "procedures": [
        {
          "id": "3",
          "code": "99.18",
          "description": "Injection or infusion of electrolytes",
          "insight": "Based on IVFD RL 1500cc administration."
        }
      ],
      "potentialFindings": []
    }
  },
  {
    "id": "p3",
    "registerNo": "2023003",
    "rmNo": "01-22-35",
    "name": "Ahmad Hidayat",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Lukman, Sp.B",
    "dischargeDate": "2023-10-24",
    "status": "Selesai",
    "medicalRecord": {
      "anamnesa": "Nyeri perut kanan bawah sejak 1 hari SMRS. Awalnya nyeri di sekitar pusar lalu berpindah ke kanan bawah. Mual (+), muntah (+), demam (+).",
      "ttv": {
        "td": "120/80",
        "nadi": "100",
        "rr": "20",
        "suhu": "38.0",
        "spo2": "99",
        "nyeri": "7"
      },
      "physicalExam": "Abdomen: McBurney sign (+), Rovsing sign (+), Psoas sign (+). Bising usus normal.",
      "labResult": "Hb: 13.0 g/dL, Leukosit: 15000/uL, Trombosit: 300000/uL.",
      "radiologyResult": "USG Abdomen: Tampak gambaran appendicitis akut, diameter 8mm, cairan bebas (-) di periapendikular.",
      "procedures": [
        "Appendectomy (Open)",
        "Pemasangan IV line",
        "Pemasangan Kateter Urine"
      ],
      "inpatientMeds": [
        "Ceftriaxone 1x2g IV",
        "Ketorolac 3x30mg IV",
        "Ranitidine 2x50mg IV"
      ],
      "dischargeMeds": [
        "Cefixime 2x200mg PO",
        "Asam Mefenamat 3x500mg PO"
      ],
      "diagnosisKlinisUtama": "Appendicitis Akut",
      "diagnosisKlinisSekunder": ""
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "K35.8",
        "description": "Acute appendicitis, other and unspecified",
        "insight": "Confirmed by RLQ pain, McBurney sign, leukocytosis, and USG findings."
      },
      "secondaryDiagnoses": [],
      "procedures": [
        {
          "id": "2",
          "code": "47.09",
          "description": "Other appendectomy",
          "insight": "Open appendectomy procedure performed."
        }
      ],
      "potentialFindings": []
    }
  },
  {
    "id": "p4",
    "registerNo": "2023004",
    "rmNo": "01-22-36",
    "name": "Sri Mulyani",
    "bpjsClass": "Kelas 3",
    "dpjp": "Dr. Budi, Sp.PD-KEMD",
    "dischargeDate": "2023-10-23",
    "status": "Draft AI",
    "medicalRecord": {
      "anamnesa": "Badan lemas sejak 1 minggu. Sering kencing malam hari, banyak makan dan minum. Luka di kaki kanan tidak sembuh-sembuh sejak 2 minggu lalu. Riwayat DM sejak 10 tahun.",
      "ttv": {
        "td": "150/90",
        "nadi": "88",
        "rr": "20",
        "suhu": "37.2",
        "spo2": "98",
        "nyeri": "3"
      },
      "physicalExam": "Ulkus diabetikum di pedis dextra digiti I-II, ukuran 3x4 cm, dasar pus (+), hiperemis (+). Edema pedis (+).",
      "labResult": "GDS: 350 mg/dL, HbA1c: 10.5%, Ureum: 80 mg/dL, Kreatinin: 2.5 mg/dL. Urinalisa: Proteinuria (+2).",
      "radiologyResult": "Rontgen Pedis Dextra: Tidak tampak osteomyelitis.",
      "procedures": [
        "Debridement luka",
        "Perawatan luka kronis",
        "Pemasangan IV line"
      ],
      "inpatientMeds": [
        "Insulin Novorapid 3x10 IU",
        "Insulin Levemir 1x14 IU",
        "Ceftriaxone 1x2g IV",
        "Metronidazole 3x500mg IV"
      ],
      "dischargeMeds": [
        "Insulin Novorapid 3x10 IU",
        "Insulin Levemir 1x14 IU",
        "Clindamycin 3x300mg PO"
      ],
      "diagnosisKlinisUtama": "Diabetes Mellitus Tipe 2",
      "diagnosisKlinisSekunder": "Diabetic Foot Ulcer, Diabetic Nephropathy"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "E11.5",
        "description": "Type 2 diabetes mellitus with peripheral angiopathy",
        "insight": "Based on T2DM history with current foot ulcer."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "E11.2",
          "description": "Type 2 diabetes mellitus with renal complications",
          "insight": "Indicated by elevated creatinine and proteinuria."
        }
      ],
      "procedures": [
        {
          "id": "3",
          "code": "86.22",
          "description": "Excisional debridement of wound, infection, or burn",
          "insight": "Debridement procedure explicitly listed."
        }
      ],
      "potentialFindings": [
        {
          "description": "Uncontrolled Hypertension",
          "insight": "BP is 150/90, not explicitly diagnosed."
        }
      ]
    }
  },
  {
    "id": "p5",
    "registerNo": "2023005",
    "rmNo": "01-22-37",
    "name": "Rizky Pratama",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Dewi, Sp.P",
    "dischargeDate": "2023-10-22",
    "status": "Belum Coding",
    "medicalRecord": {
      "anamnesa": "Sesak napas dan batuk berdahak sejak 3 hari SMRS. Dahak warna kekuningan. Demam (+) menggigil. Riwayat merokok (+).",
      "ttv": {
        "td": "110/70",
        "nadi": "112",
        "rr": "28",
        "suhu": "39.1",
        "spo2": "92",
        "nyeri": "2"
      },
      "physicalExam": "Tampak sakit berat, sesak napas. Retraksi dinding dada (+). Auskultasi paru: ronkhi basah kasar di basal paru dextra dan sinistra. Fremitus melemah di paru dextra bawah.",
      "labResult": "Hb: 12.5 g/dL, Leukosit: 18500/uL, CRP: 45 mg/L.",
      "radiologyResult": "Rontgen Thorax: Tampak infiltrat di paracardial kanan dan kiri, kesan bronchopneumonia. Ada gambaran efusi pleura dextra minimal.",
      "procedures": [
        "Oksigenasi Nasal Kanul 3 lpm",
        "Nebulisasi",
        "Pemasangan IV line",
        "Thoracentesis"
      ],
      "inpatientMeds": [
        "Levofloxacin 1x750mg IV",
        "Ambroxol 3x30mg PO",
        "Paracetamol 3x500mg IV"
      ],
      "dischargeMeds": [
        "Levofloxacin 1x500mg PO",
        "Ambroxol 3x30mg PO"
      ],
      "diagnosisKlinisUtama": "Bronchopneumonia",
      "diagnosisKlinisSekunder": "Efusi Pleura Dextra"
    }
  },
  {
    "id": "p6",
    "registerNo": "2023006",
    "rmNo": "01-22-38",
    "name": "Agus Salim",
    "bpjsClass": "Kelas 2",
    "dpjp": "Dr. Hendra, Sp.PD-KGH",
    "dischargeDate": "2023-10-26",
    "status": "Belum Coding",
    "medicalRecord": {
      "anamnesa": "Sesak napas, mual, dan bengkak di seluruh tubuh sejak 1 minggu. BAK sangat sedikit. Rutin hemodialisa namun terlewat 1 jadwal.",
      "ttv": {
        "td": "160/90",
        "nadi": "90",
        "rr": "26",
        "suhu": "36.5",
        "spo2": "96",
        "nyeri": "0"
      },
      "physicalExam": "Edema anasarca (+). Konjungtiva anemis (+). JVP meningkat.",
      "labResult": "Ureum: 210 mg/dL, Kreatinin: 9.5 mg/dL, Kalium: 6.8 mEq/L, Hb: 8.0 g/dL.",
      "radiologyResult": "USG Ginjal: Tampak ginjal mengecil bilateral dengan ekostruktur meningkat, batas kortikomeduler mengabur. Kesan CKD bilateral.",
      "procedures": [
        "Hemodialisa Cito",
        "Pemasangan CDL"
      ],
      "inpatientMeds": [
        "Dextrose 40% + Insulin 10 IU IV",
        "Ca Gluconas 1 ampul IV",
        "Furosemide 2x40mg IV",
        "PRC Transfusion 1 kolf"
      ],
      "dischargeMeds": [
        "Folic Acid 1x1 PO",
        "CaCO3 3x500mg PO"
      ],
      "diagnosisKlinisUtama": "CKD Stage 5",
      "diagnosisKlinisSekunder": "Hyperkalemia, Anemia Renal"
    }
  },
  {
    "id": "p7",
    "registerNo": "2023007",
    "rmNo": "01-22-39",
    "name": "Toni Supriadi",
    "bpjsClass": "Kelas 3",
    "dpjp": "Dr. Ratna, Sp.PD-KGEH",
    "dischargeDate": "2023-10-26",
    "status": "Draft AI",
    "medicalRecord": {
      "anamnesa": "Muntah darah hitam 2x sejak pagi, BAB hitam lengket (melena). Perut membesar sejak 1 bulan lalu. Mata menguning. Riwayat minum alkohol berat.",
      "ttv": {
        "td": "90/60",
        "nadi": "110",
        "rr": "22",
        "suhu": "36.5",
        "spo2": "98",
        "nyeri": "2"
      },
      "physicalExam": "Sklera ikterik (+). Abdomen membuncit, shifting dullness (+), caput medusae (+). Palmar eritema (+).",
      "labResult": "Hb: 6.5 g/dL, Trombosit: 60000/uL, Albumin: 2.1 g/dL, Bilirubin Total: 4.5 mg/dL, SGOT/SGPT: 180/120.",
      "radiologyResult": "USG Abdomen: Sirosis hepatis, ascites permagna, splenomegali.",
      "procedures": [
        "Transfusi PRC 2 kolf",
        "Endoskopi: Ligasi varises esofagus"
      ],
      "inpatientMeds": [
        "Somatostatin IV",
        "Ceftriaxone 1x1g IV",
        "Spironolactone 1x100mg PO",
        "Lactulose 3x1C"
      ],
      "dischargeMeds": [
        "Spironolactone 1x100mg PO",
        "Propranolol 2x10mg PO"
      ],
      "diagnosisKlinisUtama": "Sirosis Hepatis dengan Ruptur Varises Esofagus",
      "diagnosisKlinisSekunder": "Ascites Permagna"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "K74.6",
        "description": "Other and unspecified cirrhosis of liver",
        "insight": "Sirosis hepatis explicitly diagnosed."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "I85.0",
          "description": "Esophageal varices with bleeding",
          "insight": "Hematemesis from ruptured esophageal varices."
        },
        {
          "id": "3",
          "code": "R18",
          "description": "Ascites",
          "insight": "Ascites explicitly noted."
        }
      ],
      "procedures": [
        {
          "id": "4",
          "code": "42.33",
          "description": "Endoscopic excision or destruction of lesion or tissue of esophagus",
          "insight": "Endoscopic ligation of varices performed."
        },
        {
          "id": "5",
          "code": "99.04",
          "description": "Transfusion of packed cells",
          "insight": "PRC transfusion administered."
        }
      ],
      "potentialFindings": [
        {
          "description": "Thrombocytopenia",
          "insight": "Platelet count 60k but not explicitly diagnosed."
        }
      ]
    }
  },
  {
    "id": "p8",
    "registerNo": "2023008",
    "rmNo": "01-22-40",
    "name": "Sari Wulandari",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Lina, Sp.OG",
    "dischargeDate": "2023-10-26",
    "status": "Selesai",
    "medicalRecord": {
      "anamnesa": "Hamil 34 minggu, datang rujukan dari bidan dengan tekanan darah tinggi dan sakit kepala hebat. Pandangan kabur (+), mual muntah (+).",
      "ttv": {
        "td": "180/110",
        "nadi": "90",
        "rr": "24",
        "suhu": "36.8",
        "spo2": "97",
        "nyeri": "6"
      },
      "physicalExam": "Edema tungkai (+/+) berat. DJJ 140x/menit reguler.",
      "labResult": "Protein urin +3. Trombosit: 90000/uL, SGOT: 150, SGPT: 130, LDH: 650.",
      "radiologyResult": "USG Obgyn: Janin tunggal hidup presentasi kepala, TBJ 2100g.",
      "procedures": [
        "Sectio Caesarea Cito",
        "Pemberian MgSO4"
      ],
      "inpatientMeds": [
        "MgSO4 40% dosis awal",
        "Nifedipine 3x10mg PO",
        "Dexamethasone 2x6mg IV"
      ],
      "dischargeMeds": [
        "Nifedipine 1x10mg PO",
        "Cefadroxil 2x500mg PO"
      ],
      "diagnosisKlinisUtama": "Preeklamsia Berat (PEB) dengan HELLP Syndrome",
      "diagnosisKlinisSekunder": "G1P0A0 Hamil 34 Minggu"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "O14.1",
        "description": "Severe pre-eclampsia",
        "insight": "BP 180/110 with +3 proteinuria and severe symptoms."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "O14.2",
          "description": "HELLP syndrome",
          "insight": "Diagnosed by MD, supported by low platelets and high LFT/LDH."
        }
      ],
      "procedures": [
        {
          "id": "3",
          "code": "74.1",
          "description": "Low cervical cesarean section",
          "insight": "Cito SC performed."
        }
      ],
      "potentialFindings": []
    }
  },
  {
    "id": "p9",
    "registerNo": "2023009",
    "rmNo": "01-22-41",
    "name": "Fitri Ramadhani",
    "bpjsClass": "Kelas 2",
    "dpjp": "Dr. Rudi, Sp.OG",
    "dischargeDate": "2023-10-25",
    "status": "Belum Coding",
    "medicalRecord": {
      "anamnesa": "Perdarahan merembes dari jalan lahir setelah melahirkan spontan di dukun beranak 2 jam lalu. Plasenta dikatakan sudah lahir namun tidak lengkap. Pasien tampak lemas.",
      "ttv": {
        "td": "80/50",
        "nadi": "120",
        "rr": "24",
        "suhu": "36.5",
        "spo2": "95",
        "nyeri": "4"
      },
      "physicalExam": "Konjungtiva sangat pucat. Kontraksi uterus lembek. Perdarahan aktif dari ostium uteri internum (+).",
      "labResult": "Hb: 5.5 g/dL.",
      "radiologyResult": "",
      "procedures": [
        "Manual Plasenta",
        "Kuretase Sisa Plasenta",
        "Transfusi Darah"
      ],
      "inpatientMeds": [
        "Oksitosin drip 20 IU dalam 500cc RL",
        "Misoprostol 800mcg per rektal",
        "Transfusi PRC 3 kolf"
      ],
      "dischargeMeds": [
        "Sulfas Ferosus 2x1 tablet",
        "Amoxicillin 3x500mg PO"
      ],
      "diagnosisKlinisUtama": "Post Partum Hemorrhage e.c. Retensio Sisa Plasenta",
      "diagnosisKlinisSekunder": "Syok Hemoragik, Anemia Berat"
    }
  },
  {
    "id": "p10",
    "registerNo": "2023010",
    "rmNo": "01-22-42",
    "name": "Wahyu Saputra",
    "bpjsClass": "Kelas 3",
    "dpjp": "Dr. Tari, Sp.PD-KPTI",
    "dischargeDate": "2023-10-25",
    "status": "Draft AI",
    "medicalRecord": {
      "anamnesa": "Batuk darah sejak 2 hari SMRS. Batuk lama berdahak sudah 1 bulan. Berkeringat malam hari dan berat badan turun drastis. Pasien adalah ODHA dengan ARV tidak rutin.",
      "ttv": {
        "td": "110/70",
        "nadi": "98",
        "rr": "24",
        "suhu": "38.2",
        "spo2": "94",
        "nyeri": "2"
      },
      "physicalExam": "Tampak cachexia. Suara napas bronkial di apex paru kanan.",
      "labResult": "BTA Sputum: +/+/+, Anti-HIV: (+), CD4: 80 sel/mm3.",
      "radiologyResult": "Rontgen Thorax: Kavitas di apex paru kanan dengan infiltrat luas.",
      "procedures": [
        "Pemberian O2 Nasal Kanul"
      ],
      "inpatientMeds": [
        "OAT Kategori 1",
        "ARV (TDF/3TC/EFV)",
        "Asam Traneksamat 3x500mg IV"
      ],
      "dischargeMeds": [
        "OAT Kategori 1",
        "ARV (TDF/3TC/EFV)"
      ],
      "diagnosisKlinisUtama": "TB Paru BTA Positif dengan Hemoptisis",
      "diagnosisKlinisSekunder": "HIV/AIDS, Wasting Syndrome"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "A15.0",
        "description": "Tuberculosis of lung, confirmed by sputum microscopy with or without culture",
        "insight": "Based on AFB positive sputum and apical cavity."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "B20",
          "description": "Human immunodeficiency virus [HIV] disease",
          "insight": "Confirmed HIV+ with CD4 80."
        },
        {
          "id": "3",
          "code": "R04.2",
          "description": "Hemoptysis",
          "insight": "Diagnosed secondary to TB."
        }
      ],
      "procedures": [],
      "potentialFindings": []
    }
  },
  {
    "id": "p11",
    "registerNo": "2023011",
    "rmNo": "01-22-43",
    "name": "Dwi Astuti",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Anton, Sp.PD",
    "dischargeDate": "2023-10-24",
    "status": "Selesai",
    "medicalRecord": {
      "anamnesa": "BAB cair >10x/hari sejak 2 hari lalu. Muntah 5x. Lemas, haus, kencing berkurang.",
      "ttv": {
        "td": "90/60",
        "nadi": "115",
        "rr": "22",
        "suhu": "37.5",
        "spo2": "98",
        "nyeri": "3"
      },
      "physicalExam": "Mata cekung, turgor kulit lambat, mukosa bibir kering.",
      "labResult": "Ureum: 120, Kreatinin: 2.8, Natrium: 130, Kalium: 3.2.",
      "radiologyResult": "",
      "procedures": [
        "Rehidrasi IV Cepat"
      ],
      "inpatientMeds": [
        "IVFD NaCl 0.9% loading 1 liter",
        "Loperamide 2mg k/p",
        "Zinc 1x20mg"
      ],
      "dischargeMeds": [
        "Oralit k/p BAB cair",
        "Zinc 1x20mg"
      ],
      "diagnosisKlinisUtama": "Gastroenteritis Akut dengan Dehidrasi Berat",
      "diagnosisKlinisSekunder": "Acute Kidney Injury (AKI) Prerenal"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "A09.9",
        "description": "Gastroenteritis and colitis of unspecified origin",
        "insight": "Acute diarrhea and vomiting with severe dehydration."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "E86",
          "description": "Volume depletion",
          "insight": "Diagnosed due to dehydration signs and hypotension."
        },
        {
          "id": "3",
          "code": "N17.9",
          "description": "Acute renal failure, unspecified",
          "insight": "Diagnosed AKI prerenal with elevated Cr 2.8."
        }
      ],
      "procedures": [
        {
          "id": "4",
          "code": "99.18",
          "description": "Injection or infusion of electrolytes",
          "insight": "IV rapid rehydration."
        }
      ],
      "potentialFindings": []
    }
  },
  {
    "id": "p12",
    "registerNo": "2023012",
    "rmNo": "01-22-44",
    "name": "Joko Supriyanto",
    "bpjsClass": "Kelas 2",
    "dpjp": "Dr. Budi, Sp.PD",
    "dischargeDate": "2023-10-24",
    "status": "Draft AI",
    "medicalRecord": {
      "anamnesa": "Nyeri ulu hati terasa perih dan panas sejak 1 bulan, memberat 2 hari ini. Mual (+), perut kembung (+). Pola makan tidak teratur.",
      "ttv": {
        "td": "120/80",
        "nadi": "85",
        "rr": "18",
        "suhu": "36.5",
        "spo2": "99",
        "nyeri": "5"
      },
      "physicalExam": "Nyeri tekan epigastrium (+). Bising usus normal.",
      "labResult": "DbN.",
      "radiologyResult": "",
      "procedures": [],
      "inpatientMeds": [
        "Pantoprazole 1x40mg IV",
        "Sucralfate syr 3xC1 PO"
      ],
      "dischargeMeds": [
        "Omeprazole 1x20mg PO",
        "Sucralfate syr 3xC1 PO"
      ],
      "diagnosisKlinisUtama": "Dyspepsia Syndrome",
      "diagnosisKlinisSekunder": ""
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "K30",
        "description": "Functional dyspepsia",
        "insight": "Epigastric pain, nausea, and bloating diagnosed as dyspepsia."
      },
      "secondaryDiagnoses": [],
      "procedures": [],
      "potentialFindings": []
    }
  },
  {
    "id": "p13",
    "registerNo": "2023013",
    "rmNo": "01-22-45",
    "name": "Rina Kumala",
    "bpjsClass": "Kelas 3",
    "dpjp": "Dr. Ratna, Sp.OG",
    "dischargeDate": "2023-10-23",
    "status": "Draft AI",
    "medicalRecord": {
      "anamnesa": "Hamil 39 minggu, mules-mules sejak malam. Keluar lendir darah. Air ketuban belum pecah.",
      "ttv": {
        "td": "110/70",
        "nadi": "80",
        "rr": "20",
        "suhu": "36.6",
        "spo2": "99",
        "nyeri": "7"
      },
      "physicalExam": "His 3x/10'/40\". VT: Pembukaan 5cm, ketuban utuh, presentasi kepala.",
      "labResult": "Hb 11.5, Leukosit 10000.",
      "radiologyResult": "",
      "procedures": [
        "Persalinan Normal per Vaginam"
      ],
      "inpatientMeds": [
        "Oksitosin 10 IU IM"
      ],
      "dischargeMeds": [
        "Asam Mefenamat 3x500mg PO",
        "SF 1x1 PO"
      ],
      "diagnosisKlinisUtama": "Partus Normal, G1P0A0",
      "diagnosisKlinisSekunder": ""
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "O80",
        "description": "Single spontaneous delivery",
        "insight": "Diagnosed spontaneous vaginal delivery."
      },
      "secondaryDiagnoses": [],
      "procedures": [
        {
          "id": "2",
          "code": "73.59",
          "description": "Other manually assisted delivery",
          "insight": "Normal delivery performed."
        }
      ],
      "potentialFindings": []
    }
  },
  {
    "id": "p14",
    "registerNo": "2023014",
    "rmNo": "01-22-46",
    "name": "Junaedi",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Hendra, Sp.JP",
    "dischargeDate": "2023-10-23",
    "status": "Selesai",
    "medicalRecord": {
      "anamnesa": "Sesak napas saat beraktivitas dan tidur telentang. Bengkak pada kedua kaki sejak 2 minggu. Sering terbangun malam karena sesak.",
      "ttv": {
        "td": "150/90",
        "nadi": "105",
        "rr": "26",
        "suhu": "36.5",
        "spo2": "94",
        "nyeri": "0"
      },
      "physicalExam": "JVP meningkat. Kardiomegali (+). Ronkhi basah halus di basal paru. Edema pitting kedua tungkai bawah.",
      "labResult": "NT-proBNP: 4500 pg/mL.",
      "radiologyResult": "Rontgen Thorax: Kardiomegali (CTR 65%), kongesti paru.",
      "procedures": [
        "Ekokardiografi"
      ],
      "inpatientMeds": [
        "Furosemide 2x40mg IV",
        "Spironolactone 1x25mg PO",
        "Bisoprolol 1x2.5mg PO"
      ],
      "dischargeMeds": [
        "Furosemide 1x40mg PO",
        "Bisoprolol 1x2.5mg PO"
      ],
      "diagnosisKlinisUtama": "Congestive Heart Failure (CHF)",
      "diagnosisKlinisSekunder": "Hypertension"
    },
    "codingResult": {
      "primaryDiagnosis": {
        "id": "1",
        "code": "I50.0",
        "description": "Congestive heart failure",
        "insight": "Diagnosed based on orthopnea, edema, and high NT-proBNP."
      },
      "secondaryDiagnoses": [
        {
          "id": "2",
          "code": "I10",
          "description": "Essential (primary) hypertension",
          "insight": "Underlying hypertension history."
        }
      ],
      "procedures": [
        {
          "id": "3",
          "code": "88.72",
          "description": "Diagnostic ultrasound of heart",
          "insight": "Echocardiography performed."
        }
      ],
      "potentialFindings": []
    }
  },
  {
    "id": "p15",
    "registerNo": "2023015",
    "rmNo": "01-22-47",
    "name": "Nita Talia",
    "bpjsClass": "Kelas 2",
    "dpjp": "Dr. Sarah, Sp.A",
    "dischargeDate": "2023-10-22",
    "status": "Belum Coding",
    "medicalRecord": {
      "anamnesa": "Anak usia 2 tahun demam mendadak sejak 2 hari lalu. Anak gelisah, sering menangis sambil memegang telinga kanan. Keluar cairan warna kekuningan dari telinga.",
      "ttv": {
        "td": "100/60",
        "nadi": "120",
        "rr": "28",
        "suhu": "38.9",
        "spo2": "98",
        "nyeri": "5"
      },
      "physicalExam": "Otoskopi: Membran timpani telinga kanan perforasi, tampak sekret purulen.",
      "labResult": "Leukosit 16000/uL.",
      "radiologyResult": "",
      "procedures": [
        "Pembersihan telinga"
      ],
      "inpatientMeds": [
        "Amoxicillin-Clavulanate syr",
        "Paracetamol syr"
      ],
      "dischargeMeds": [
        "Amoxicillin-Clavulanate syr",
        "Paracetamol syr"
      ],
      "diagnosisKlinisUtama": "Otitis Media Supuratif Akut (OMSA)",
      "diagnosisKlinisSekunder": ""
    }
  },
  {
    "id": "p16",
    "registerNo": "2023016",
    "rmNo": "01-22-48",
    "name": "Hendrik Wijaya",
    "bpjsClass": "Kelas 1",
    "dpjp": "Dr. Rahman, Sp.An-KIC",
    "dischargeDate": "2023-10-21",
    "status": "Belum Coding",
    "medicalRecord": {
      "anamnesa": "Pasien rujukan dari bangsal dengan penurunan kesadaran. Sebelumnya dirawat dengan ISK berulang. Kini napas cepat, demam tinggi, dan akral dingin.",
      "ttv": {
        "td": "80/40",
        "nadi": "130",
        "rr": "32",
        "suhu": "39.5",
        "spo2": "90",
        "nyeri": "0"
      },
      "physicalExam": "Somnolen, GCS 10. Akral dingin, pucat, mottling (+). Terdengar ronkhi kasar.",
      "labResult": "Leukosit: 32000/uL, Laktat: 4.5 mmol/L, Procalcitonin: 25 ng/mL. Urinalisa: Leukosit penuh, nitrit (+).",
      "radiologyResult": "Rontgen Thorax: Normal.",
      "procedures": [
        "Pemasangan CVC",
        "Intubasi & Ventilasi Mekanik",
        "Resusitasi Cairan"
      ],
      "inpatientMeds": [
        "Norepinephrine drip",
        "Meropenem 3x1g IV",
        "Paracetamol 3x1g IV"
      ],
      "dischargeMeds": [],
      "diagnosisKlinisUtama": "Sepsis",
      "diagnosisKlinisSekunder": "Urinary Tract Infection (UTI), Syok Septik"
    }
  }
];

// In-memory store initialized with fallback
export let patientsStore: Patient[] = initialPatients;

// Persistence helpers (Server-side only)
const getDbPath = () => {
  if (typeof window !== 'undefined') return null;
  const path = require('path');
  return path.join(process.cwd(), 'src/lib/patients.json');
};

const saveToDisk = (data: Patient[]) => {
  if (typeof window !== 'undefined') return;
  try {
    const fs = require('fs');
    const path = getDbPath();
    if (path) {
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Failed to save to disk:', err);
  }
};

const loadFromDisk = () => {
  if (typeof window !== 'undefined') return null;
  try {
    const fs = require('fs');
    const path = getDbPath();
    if (path && fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to load from disk:', err);
  }
  return null;
};

// Initialize store with fallback only. 
// Do NOT overwrite this at the module level to ensure SSR and Client hydration match exactly.

export function getPatients(): Patient[] {
  if (typeof window === 'undefined') {
    const diskData = loadFromDisk();
    if (diskData) return diskData;
    // If no file exists, create one with initial data
    saveToDisk(initialPatients);
  }
  return patientsStore;
}

export function updatePatient(id: string, updatedData: Partial<Patient>): Patient | null {
  console.log(`[mockDb] Updating patient ${id}`, updatedData);
  let currentData = getPatients();
  const index = currentData.findIndex(p => p.id === id);
  if (index !== -1) {
    currentData[index] = { ...currentData[index], ...updatedData };
    console.log(`[mockDb] Successfully updated ${id}`);
    
    // Persist to disk on server
    saveToDisk(currentData);
    
    return currentData[index];
  }
  return null;
}
