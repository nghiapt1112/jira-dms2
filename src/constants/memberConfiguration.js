/**
 * Member Configuration for Developer Quality Dashboard
 * This file defines which team members should have KPIs calculated
 * Located in src/constants/ alongside other JIRA configuration files
 * 
 * Instructions:
 * 1. Check the browser console for the current list of all users when the dashboard loads
 * 2. Copy the user objects from the console log (includes jiraId and name)
 * 3. Paste them into the appropriate arrays below (developers or qa)
 * 4. Only members listed in these arrays will have their KPIs calculated
 * 
 * Object Structure:
 * { jiraId: "user.account.id", name: "Display Name" }
 * 
 * The system will match by either jiraId or name for flexibility
 */

export const memberConfiguration = {
  // Array of developer objects - these will be included in developer KPI calculations
  developers: [
    {
      jiraId: "712020:92de1f44-d98b-40dc-b39e-244fff709123",
      name: "Andra Satria",
      level: "senior"
    },
    {
      jiraId: "640e83ba0e6828ab2023c2c8",
      name: "Tuan Hoang",
      level: "senior"
    },
    {
      jiraId: "633aa8ba97148a8301fe15d8",
      name: "Duy Tang",
      level: "senior"
    },
    {
      jiraId: "712020:c07a6ad0-1c54-42ac-a6eb-e633afcac934",
      name: "Imat Marasigan",
      level: "senior"
    },
    {
      jiraId: "712020:37dc1b3c-25a9-486b-8c72-67eadab8d890",
      name: "Renal Apriansyah",
      level: "senior"
    },
    {
      jiraId: "712020:2f30ba06-ef74-4415-90a8-38edfd27a0f2",
      name: "Ryan Vincent Lamaroza",
      level: "senior"
    },
    {
      jiraId: "712020:888f0056-80d3-4461-b6f1-75c565d9f5f6",
      name: "Junio Akarda",
      level: "senior"
    },
    {
      jiraId: "712020:17939990-fd0c-4762-88fb-964622d2ca62",
      name: "Asep Mochamad Setyadi (Omat)",
      level: "middle"
    },
    {
      jiraId: "639fffc2d3aeefa4053ffc71",
      name: "Minh Tran",
      level: "middle"
    },
    {
      jiraId: "712020:be95c273-96eb-4c77-8e76-774348fd3309",
      name: "David Duy Nguyen",
      level: "middle"
    },
    {
      jiraId: "641923ad9d2bc6c90a8ad5fe",
      name: "Minh Ta",
      level: "middle"
    },
    {
      jiraId: "712020:7ce2c4d5-26c0-4cb9-aa12-84ca3b33edcd",
      name: "Vincent Yapranz",
      level: "middle"
    },
    {
      jiraId: "712020:5aec5bd8-b56d-4408-bc6f-4f1c3359704b",
      name: "Izal Fathoni",
      level: "middle"
    },
    {
      jiraId: "712020:a406f86b-ff65-41e2-8bdb-333302c8527d",
      name: "Henry Phung",
      level: "senior"
    },
    // {
    //   jiraId: "6248f229247a4b00691ef245",
    //   name: "Loi Le"
    // },
    {
      jiraId: "712020:a3588c8e-d495-45f4-9148-635b4ecc1f85",
      name: "Satriko Aditya"
    },
    // {
    //   jiraId: "712020:c4e84197-2fa3-43ae-83e3-484b00b3c39c",
    //   name: "Mike Dung Truong"
    // },
    {
      jiraId: "712020:0b3363e6-0706-4f3e-8827-df1c68d9bbd1",
      name: "Yudanis Taqwin Rohman",
      level: "middle"
    },
    {
      jiraId: "712020:864b6a6b-15b1-4a4b-9e06-0ab535ae801e",
      name: "Faishal Abdur Rahman",
      level: "middle"
    },
    {
      jiraId: "622ef04c1c09d2007012d7a1",
      name: "nhat nguyen",
      level: "senior"
    },
    // {
    //   jiraId: "62d9430273bd9d67b289f146",
    //   name: "Hieu Phan"
    // },
    {
      jiraId: "712020:4fd87d3d-95a6-4076-90fc-20c8209c28e4",
      name: "Welly Winata",
      level: "middle"
    },
    {
      jiraId: "62f0dde0432ef494c8cb4ad4",
      name: "Luan Nguyen",
      level: "senior"
    },
    {
      jiraId: "62ea08f032850ea2a32431df",
      name: "Manh Nguyen",
      level: "middle"
    },
    {
      jiraId: "6302fbce7cfac1bfa6f955aa",
      name: "Imamul Akhyar",
      level: "middle"
    },
    // {
    //   jiraId: "712020:a366aa70-1ac4-42b0-a8d5-29cdbb6d5ec4",
    //   name: "Former user"
    // },
    {
      jiraId: "712020:b8e485f2-11b3-4bdf-b711-ffb64749eaaf",
      name: "Ilham Fadhilah",
      level: "senior"
    },
    {
      jiraId: "712020:6fed283c-6e2b-469f-a243-1c63577247ee",
      name: "Edward Viet Ha Quoc",
      level: "middle"
    },
    {
      jiraId: "62ea1e6a1323922c61e1df5a",
      name: "Jay Movaliya",
      level: "senior"
    },
    // {
    //   jiraId: "712020:f629b77e-d90f-4cac-b900-525723edaa7d",
    //   name: "Simon Nguyen"
    // },
    {
      jiraId: "712020:0f277024-cf66-492a-ae1c-59b22024bd8f",
      name: "Aris Dwi Suryono",
      level: "middle"
    },
    {
      jiraId: "712020:226ec21c-b5df-40d0-854c-bffd8b33d3f8",
      name: "Thanh Nguyen Dai",
      level: "middle"
    },
    // {
    //   jiraId: "712020:aa91326f-ffab-470c-948e-029d01abb43a",
    //   name: "Edward Jibson"
    // },
    {
      jiraId: "712020:612e04bc-27d3-4b0a-973e-b505f7d99258",
      name: "hung.pham",
      level: "senior"
    },
    {
      jiraId: "712020:14b91211-2d77-4340-830f-ee141d1d6c72",
      name: "Toan Nguyen Nhut",
      level: "middle"
    },
    // {
    //   jiraId: "62ea1df525abc07e51c5c690",
    //   name: "Edsil Basadre"
    // },
    // {
    //   jiraId: "712020:826fc980-25d1-49c2-a273-3b36bac9a432",
    //   name: "Ade Yahya"
    // },
    {
      jiraId: "624a984e7a3f9e006ab4ab77",
      name: "Huynh Bui",
      level: "senior"
    },
    // {
    //   jiraId: "712020:ce33b206-2d02-4395-b00f-16b4910d50b9",
    //   name: "Klebson Leite"
    // },
    // {
    //   jiraId: "712020:ff0cfe68-2096-41d5-8b4c-5cc68d9f4dfc",
    //   name: "Ivan Charapanau"
    // },
    // {
    //   jiraId: "712020:cae6b800-064b-4d5e-964d-b831f239c761",
    //   name: "Quentin Maujean"
    // },
    {
      jiraId: "712020:721366a3-973e-47b2-ada2-70804f2bbed0",
      name: "Ahmad Alfan",
      level: "middle"
    },
    // {
    //   jiraId: "627892a28dd5f30068544344",
    //   name: "Tan Vo"
    // },
    // {
    //   jiraId: "62e9daeab5b801a9afeeec35",
    //   name: "Jefry Dewangga"
    // },
    // {
    //   jiraId: "627892a281d82e00680a862c",
    //   name: "Kevin Nguyễn"
    // },
    // {
    //   jiraId: "62f0e255c1b3a10ac3ab8d2f",
    //   name: "quy truong"
    // },
    // {
    //   jiraId: "712020:95497248-d429-437e-8e1e-d3b426f38df1",
    //   name: "Yosua Silalahi"
    // },
    // {
    //   jiraId: "712020:f37b7ce4-4ade-451d-85e0-7138b34f7cf1",
    //   name: "Viet Tran Tuan"
    // },
    // {
    //   jiraId: "627892a2236090006f5eec94",
    //   name: "Managed Apps"
    // },
    // {
    //   jiraId: "62f0dddd48e310e672970a14",
    //   name: "Hong Nhat Nguyen"
    // },
    // {
    //   jiraId: "712020:fd334f32-065c-4231-98cf-1233c923427a",
    //   name: "Guntur"
    // },
    {
      jiraId: "712020:7be2e871-0c1b-4961-9785-4fa836473d75",
      name: "ilham.akbar",
      level: "middle"
    },
    // {
    //   jiraId: "62dfddb9a855c6955879df03",
    //   name: "Osaki Michihiko"
    // },
    // {
    //   jiraId: "712020:9e1a1c14-f996-459e-ade1-088bca99fbbc",
    //   name: "Tam Nguyen"
    // },
    {
      jiraId: "712020:ff028045-1d74-419b-9f78-af368e59bd5a",
      name: "Alina Truong",
      level: "middle"
    },
    {
      jiraId: "712020:1ee68a66-f5f5-461f-b006-2db22e59a318",
      name: "steve.tuanphan",
      level: "middle"
    },
    {
      jiraId: "712020:ab69b708-cd6e-4d3e-8eab-6cc15b628f8d",
      name: "Ryan Risdian Ciptayadi",
      level: "middle"
    },
    // {
    //   jiraId: "712020:8c3c247d-1008-418e-a62b-309a4eda0b34",
    //   name: "Juan Alphonso Maligad"
    // },
    // {
    //   jiraId: "712020:112a5275-689e-49f2-a811-2abe01025a71",
    //   name: "Grace Sonia Hienata"
    // },
    // {
    //   jiraId: "712020:3aff912d-5697-47df-a287-dd6cc126eaf5",
    //   name: "Kevin Felisilda"
    // },
    // {
    //   jiraId: "712020:2c69da8e-b4b7-4c72-961c-d60d0912c768",
    //   name: "Leheng Wang"
    // },
    // {
    //   jiraId: "642aa66b22330bdf97ab2b3c",
    //   name: "Souhei Eto"
    // },
    // {
    //   jiraId: "712020:ef9c284e-130a-4fa8-a8a1-ac4499e3fac6",
    //   name: "Alex Klimiankov"
    // },
    // {
    //   jiraId: "712020:c8c58d02-8ac0-4ea5-8ae9-700b4272b711",
    //   name: "Aurimas Gaidys"
    // },
    // {
    //   jiraId: "712020:2969e315-d426-4f46-98cc-99d57c1ed56a",
    //   name: "Yoshitaka Sasaki"
    // },
    // {
    //   jiraId: "712020:bcddd760-355a-4050-94da-7e0cda5cb965",
    //   name: "Russell Ivan Caluza"
    // },
    // {
    //   jiraId: "62f0dddde50f2f2a395644b0",
    //   name: "Hung Duong"
    // },
    // {
    //   jiraId: "6320729c55a96b85c3119fb9",
    //   name: "Takuya Matsumoto"
    // },
    // {
    //   jiraId: "712020:e190a0f2-e510-4488-ac39-c0f46a012702",
    //   name: "Nami Mohamed Nilam"
    // },
    // {
    //   jiraId: "712020:7dfdb6c1-8ad6-412a-beaa-cc3fb69d8b43",
    //   name: "chi.le"
    // },
    // {
    //   jiraId: "712020:1afff985-6c2c-4011-9891-a2fe9058b26b",
    //   name: "Daisuke Sugiyama"
    // },
    // {
    //   jiraId: "712020:10ec82f2-23cd-4ad3-8411-ab15a127d109",
    //   name: "Vladyslav Mehera"
    // },
    // {
    //   jiraId: "712020:4799969c-5a5e-4c60-9e6f-a14a5fa4ca75",
    //   name: "Sammy Saglam"
    // },
    // {
    //   jiraId: "70121:7eafd1c7-bb89-4d76-b49e-e9b4039fc44a",
    //   name: "shoya kubo"
    // },
    // {
    //   jiraId: "712020:c8f6277e-58d5-45e8-814e-135fd4ee3d7b",
    //   name: "Fachrul Budi Prayoga"
    // },
    // {
    //   jiraId: "712020:7aabddf8-4747-4a83-b38a-32df2f0d0030",
    //   name: "Yutaru Miki"
    // },
    // {
    //   jiraId: "712020:9551520d-e64f-4ebb-997f-70e86e5ca36a",
    //   name: "Tu"
    // },
    // {
    //   jiraId: "712020:5c5ddc19-d082-4604-ad59-66ea85c5c032",
    //   name: "Julian Fuchs"
    // },
    // {
    //   jiraId: "6311b4543e578bb3b5fee7f6",
    //   name: "Yuko Fujino"
    // },
    // {
    //   jiraId: "712020:965137b3-7903-49ad-a8db-a38c97c43702",
    //   name: "Keisuke Nawa"
    // },
    // {
    //   jiraId: "712020:e6c48e72-fd89-4142-8425-e1a4ca72ccaf",
    //   name: "hiroyuki.kikuchi"
    // },
    {
      jiraId: "712020:80bc4a1d-85f6-4c68-9725-acdca43623fa",
      name: "Phan Trung",
      level: "middle"
    },
    // {
    //   jiraId: "5c89dc71279ad179046dd626",
    //   name: "yumi mizumura"
    // },
    // {
    //   jiraId: "712020:bf67457b-4e55-431b-b83d-0333b2a9a7c0",
    //   name: "Sativel \"Nathan\" Thamilvanan"
    // },
    // {
    //   jiraId: "712020:1855b18f-e340-405c-97ec-291ec360d6f1",
    //   name: "Dima Veremchuk"
    // },
    // {
    //   jiraId: "712020:079e509b-bfa4-4525-b8ad-12fe7251689d",
    //   name: "Hiroki Umezawa"
    // },
    // {
    //   jiraId: "712020:5802f033-bfc8-49b6-a8af-395b7f473a53",
    //   name: "Casey Nam Bui Khac"
    // },
    // {
    //   jiraId: "712020:83f7a565-9b5f-44b1-a70b-b91f36aa03f6",
    //   name: "M Bahrul Bahar"
    // },
    // {
    //   jiraId: "712020:282f6bfc-2587-49be-b187-774212a33924",
    //   name: "Fadli Pratama Putra"
    // },
    // {
    //   jiraId: "712020:a2431396-1f59-4616-9e9b-49e9b2b6e734",
    //   name: "shinya.teramoto"
    // },
    // {
    //   jiraId: "63035c73bcb35371090ecc23",
    //   name: "Kazumi Kokuryo"
    // },
    // {
    //   jiraId: "6227f8f2a1245000688ab2c2",
    //   name: "Tadashi Ishikawa"
    // },
    // {
    //   jiraId: "61244f1d129802006acfbca3",
    //   name: "SHIFT 三浦 翔"
    // },
    // {
    //   jiraId: "62ce68a41e326fd93012b091",
    //   name: "diomari madulara"
    // },
    // {
    //   jiraId: "6228466e6a4c4c0070b16a18",
    //   name: "高橋 慶太郎"
    // },
    // {
    //   jiraId: "712020:29dd53a0-931f-41c3-ba41-a21c93c44175",
    //   name: "Tomoharu Sasaki"
    // },
    // {
    //   jiraId: "712020:f3727fd8-ab51-426d-9d5c-ab13d66d8bfb",
    //   name: "Yogi Yudistira"
    // },
    // {
    //   jiraId: "712020:813681d0-25ef-4b47-87cd-f814d0169792",
    //   name: "Yoshio Fujiwara"
    // },
    // {
    //   jiraId: "712020:0748a8e0-33ee-474d-9602-f1a6c751a031",
    //   name: "村上 和隆"
    // },
    // {
    //   jiraId: "712020:d85880b4-df87-4a03-9af0-c5a32343d5c4",
    //   name: "Fardo Rahmandika"
    // }
  ],
  
  // Array of QA team member objects - these will be included in QA KPI calculations
  qa: [
    // Add QA team member objects here, for example:
    // { jiraId: "alice.wilson", name: "Alice Wilson" },
    // { jiraId: "mike.davis", name: "Mike Davis" }
  ],
  
  // Array of project objects - these will be pre-populated in project filters
  projects: [
    { key: "BCP", name: "Borderless City Project", pointType: "HOURS_BASE"  },
    { key: "CF", name: "Calbee-FfF" , pointType: "STORYPOINT_BASE" },
    { key: "DAICO", name: "Daicolo" , pointType: "HOURS_BASE" },
    { key: "DAAI", name: "Daicolo-AIFeatures" , pointType: "HOURS_BASE" },
    { key: "ENT", name: "Enterprise Team" , pointType: "HOURS_BASE" },
    { key: "HG", name: "Hiruta GoDump" , pointType: "HOURS_BASE" },
    { key: "IP", name: "Internal PJ" , pointType: "HOURS_BASE" },
    { key: "IS", name: "Ishibashi Gakki" , pointType: "STORYPOINT_BASE" },
    { key: "KB", name: "Kuribara" , pointType: "HOURS_BASE" },
    { key: "MIT", name: "Mitaden" , pointType: "HOURS_BASE" },
    { key: "NKR2", name: "NikkenRentacom_2" , pointType: "HOURS_BASE" },
    { key: "OOPS", name: "Oops" , pointType: "HOURS_BASE" },
    { key: "PMAX", name: "PROMAX" , pointType: "HOURS_BASE" },
    { key: "PDS", name: "Product Design" , pointType: "HOURS_BASE" },
    { key: "RAG", name: "RAG" , pointType: "HOURS_BASE" },
    { key: "SG", name: "SCOP-GO" , pointType: "HOURS_BASE" },
    { key: "STU", name: "SD - Time Utilization " , pointType: "HOURS_BASE" },
    { key: "SIP", name: "SD Internal Project" , pointType: "HOURS_BASE" },
    { key: "SEK", name: "Sekisuiheim" , pointType: "HOURS_BASE" },
    { key: "TG", name: "TOHO GAS" , pointType: "HOURS_BASE" },
    { key: "TOUC", name: "TOUCH" , pointType: "HOURS_BASE" },
    { key: "TIT", name: "Titans" , pointType: "HOURS_BASE" },
    { key: "TS", name: "Tokyu-Stay" , pointType: "HOURS_BASE" },
    { key: "WON", name: "WonderTable" , pointType: "HOURS_BASE" },
    { key: "YUB", name: "Yubisui" , pointType: "STORYPOINT_BASE" },
    { key: "YUIM", name: "Yuime" , pointType: "STORYPOINT_BASE" },
    { key: "ECHO", name: "echo", pointType: "HOURS_BASE"  }
  ],
  issueTypes: [
    "Bug",
    "Capacity",
    "Epic",
    "Improvement",
    "Meeting",
    "PR Review",
    "Question",
    "SD-Improvement",
    "Story",
    "Sub-task",
    "Subtask",
    "Task"
  ],
  rootCauses: [
    "Change in Design",
    "Change in Requirements",
    "Communication Gaps",
    "Concurrency Issue",
    "Customer Perspective",
    "Data Migration",
    "Environment Issue",
    "Human Error",
    "Implementation Issue",
    "Inadequate Requirements Analysis",
    "Infrastructure or Deployment Issues",
    "Insufficient Testing",
    "Legacy Code",
    "Missed Requirement",
    "Other( If other please decribe in the root cause text box)",
    "Process Gaps",
    "Release/Code Merge Issue",
    "Test Data Issue",
    "Third-Party Issue",
    "Tool or Automation Issue",
    "Unknown",
    "User Input Validation Failure",
    "Version Control Mismanagement"
  ],
  statuses: [
    "BACK FROM QA",
    "BLOCK",
    "BLOCKED",
    "Back from QA",
    "Blocked",
    "Blocked (QA)",
    "Blocked By QA",
    "Blocked by QA",
    "CONFIRM BY PM",
    "Canceled(DO NOT USE)",
    "Closed(DO NOT USE)",
    "Create Document",
    "Dev / QA Done",
    "Dev Test",
    "Done",
    "IN QA",
    "In Progress",
    "In QA",
    "In Review",
    "Log Time",
    "NO ACTION",
    "ON HOLD",
    "Pending",
    "QA",
    "QA Blocked",
    "QA in Progress",
    "Ready for QA",
    "Rejected",
    "Review",
    "Selected for Development",
    "Test by Dev",
    "Test by dev",
    "To Do",
    "Under QA",
    "Verify(DO NOT USE)",
    "Waiting for QA"
  ],
  // Configuration settings for KPI calculations
  kpiSettings: {
    // If true, only calculate KPIs for members listed in developers/qa arrays
    onlyCalculateForConfiguredMembers: true,
    
    // Minimum story points threshold for a member to be included
    minimumStoryPointsThreshold: 0,
    
    // If true, exclude 'Unassigned' issues from all calculations
    excludeUnassigned: true,
    
    // If true, separate developers and QA in different sections of the dashboard
    separateByRole: true
  },

  // Configuration for reopen detection 
  reopenDetection: {
    // Default configuration for all projects
    default: {
      // Status names that indicate a bug has been reopened
      reopenStatuses: ["REOPENED", "Reopened"],
      
      // Status transitions that count as reopening (from closed states back to active)
      reopenTransitions: [
        { from: ["Done", "Closed", "Resolved"], to: ["In Progress", "To Do", "Open"] },
        { from: ["Waiting for QA", "Ready for QA"], to: ["In Progress", "Back from QA"] }
      ]
    },
  },

  // Configuration for severity/priority field mapping
  severityConfiguration: {
    // Default configuration for all projects  
    default: {
      // Field to use for severity data
      severityField: "customfield_10049", // Default severity custom field
      
      // Fallback to priority field if severity field is null/empty
      usePriorityFallback: true,
      
      // Mapping from JIRA values to standardized severity levels
      severityMapping: {
        // For custom severity field values
        "Critical": "Critical",
        "Functional": "Major", 
        "Non-Functional": "Major",
        "Integration": "Major",
        "Performance": "Major",
        "Security": "Critical",
        "UI/UX": "Minor",
        "Data": "Major",
        
        // For priority field values (when used as fallback)
        "Highest": "Critical",
        "Important": "Critical", 
        "High": "Major",
        "Medium": "Minor",
        "Low": "Low",
        "Lowest": "Cosmetic"
      },
      
      // Standard severity levels used in dashboard
      severityLevels: ["Critical", "Major", "Minor", "Low", "Cosmetic"],
      
      // Severity weights for weighted bug rate calculations
      severityWeights: {
        "Critical": 1.0,
        "Major": 0.7,
        "Minor": 0.5,
        "Low": 0.3,
        "Cosmetic": 0.1,
        "Unknown": 0.2
      },
      
      // Default severity to use when no mapping is found (instead of "Unknown")
      defaultSeverity: "Minor"
    },
    
    // Project-specific configurations (override default)
    projects: {
      // Example: "WON": { severityField: "priority", usePriorityFallback: false, ... }
    }
  },

  // Severity levels for filters - centralized configuration
  severities: [
    "Critical",
    "Major", 
    "Minor",
    "Low",
    "Cosmetic"
  ],

  // Default filter configuration
  filterDefaults: {
    // Default status filter for "delivered" work metrics
    // This is used for story points, time tracking, and efficiency calculations
    statusFilter: ["BACK FROM QA",
      "BLOCK",
      "BLOCKED",
      "Back from QA",
      "Blocked",
      "Blocked (QA)",
      "Blocked By QA",
      "Blocked by QA",
      "CONFIRM BY PM",
      "Dev / QA Done",
      "Dev Test",
      "Done",
      "IN QA",
      "In QA",
      "In Review",
      "Log Time",
      "NO ACTION",
      "ON HOLD",
      "Pending",
      "QA",
      "QA Blocked",
      "QA in Progress",
      "Ready for QA",
      "Review",
      "Selected for Development",
      "Test by Dev",
      "Test by dev",
      "Under QA",
      "Verify(DO NOT USE)",
      "Waiting for QA"],
    
    // Available statuses that can be selected in filters
    availableStatuses: [
      "To Do",
      "In Progress", 
      "In Review",
      "Done",
      "Closed"
    ]
  },

  // Performance targets for different project types and developer levels
  performanceTargets: {
    HOURS_BASE: {
      all: {
        totalPointWeekTarget: 35,
        totalPointMonthTarget: 140,
        totalPointQuarterTarget: 420
      }
    },
    STORYPOINT_BASE: {
      middle: {
        totalPointWeekTarget: 25,
        totalPointMonthTarget: 100,
        totalPointQuarterTarget: 300
      },
      senior: {
        totalPointWeekTarget: 30,
        totalPointMonthTarget: 120,
        totalPointQuarterTarget: 360
      }
    }
  },

  // Target line configuration for Chart.js
  targetLineConfig: {
    HOURS_BASE: {
      all: {
        color: '#ff9800',
        borderWidth: 2,
        borderDash: [5, 5],
        label: 'Target (All)'
      }
    },
    STORYPOINT_BASE: {
      middle: {
        color: '#2196f3',
        borderWidth: 2,
        borderDash: [5, 5],
        label: 'Target (Middle)'
      },
      senior: {
        color: '#4caf50',
        borderWidth: 2,
        borderDash: [5, 5],
        label: 'Target (Senior)'
      }
    }
  }
}

/**
 * Get reopen detection configuration for a project
 * @param {string} projectKey - The project key (e.g., "YUIM", "WON")
 * @returns {Object} - Reopen detection configuration
 */
export const getReopenDetectionConfig = (projectKey) => {
  const projectConfig = memberConfiguration.reopenDetection.projects?.[projectKey]
  return projectConfig || memberConfiguration.reopenDetection.default
}

/**
 * Get severity configuration for a project
 * @param {string} projectKey - The project key (e.g., "YUIM", "WON") 
 * @returns {Object} - Severity configuration
 */
export const getSeverityConfig = (projectKey) => {
  const projectConfig = memberConfiguration.severityConfiguration.projects[projectKey]
  return projectConfig || memberConfiguration.severityConfiguration.default
}

/**
 * Get severity weights configuration for a project
 * @param {string} projectKey - The project key (e.g., "YUIM", "WON")
 * @returns {Object} - Severity weights configuration
 */
export const getSeverityWeights = (projectKey) => {
  const severityConfig = getSeverityConfig(projectKey)
  return severityConfig.severityWeights || memberConfiguration.severityConfiguration.default.severityWeights
}

/**
 * Helper function to check if a member should be included in KPI calculations
 * @param {string} memberName - The name of the team member
 * @param {string} jiraId - The JIRA ID of the team member (optional)
 * @returns {Object} - { isIncluded: boolean, role: 'developer' | 'qa' | null, memberInfo: Object | null }
 */
export const shouldIncludeMember = (memberName, jiraId = null) => {
  if (!memberName || memberName === 'Unassigned') {
    return { isIncluded: false, role: null, memberInfo: null }
  }
  
  // Check developers by name or jiraId
  const developerMatch = memberConfiguration.developers.find(dev => 
    dev.name === memberName || (jiraId && dev.jiraId === jiraId)
  )
  if (developerMatch) {
    return { isIncluded: true, role: 'developer', memberInfo: developerMatch }
  }
  
  // Check QA by name or jiraId
  const qaMatch = memberConfiguration.qa.find(qa => 
    qa.name === memberName || (jiraId && qa.jiraId === jiraId)
  )
  if (qaMatch) {
    return { isIncluded: true, role: 'qa', memberInfo: qaMatch }
  }
  
  // If onlyCalculateForConfiguredMembers is false, include all members as developers
  if (!memberConfiguration.kpiSettings.onlyCalculateForConfiguredMembers) {
    return { isIncluded: true, role: 'developer', memberInfo: { name: memberName, jiraId: jiraId || memberName } }
  }
  
  return { isIncluded: false, role: null, memberInfo: null }
}

/**
 * Get all configured members
 * @returns {Array} - Array of all configured member objects
 */
export const getAllConfiguredMembers = () => {
  return [
    ...memberConfiguration.developers,
    ...memberConfiguration.qa
  ]
}

/**
 * Get all configured projects
 * @returns {Array} - Array of all configured project objects
 */
export const getAllConfiguredProjects = () => {
  return memberConfiguration.projects || []
}

/**
 * Get all configured project keys
 * @returns {Array} - Array of all configured project keys
 */
export const getAllConfiguredProjectKeys = () => {
  return memberConfiguration.projects?.map(proj => proj.key) || []
}

/**
 * Get all configured project names
 * @returns {Array} - Array of all configured project names
 */
export const getAllConfiguredProjectNames = () => {
  return memberConfiguration.projects?.map(proj => proj.name) || []
}

/**
 * Get all configured member names
 * @returns {Array} - Array of all configured member names
 */
export const getAllConfiguredMemberNames = () => {
  return [
    ...memberConfiguration.developers.map(dev => dev.name),
    ...memberConfiguration.qa.map(qa => qa.name)
  ]
}

/**
 * Get members by role
 * @param {string} role - 'developer' or 'qa'
 * @returns {Array} - Array of member objects for the specified role
 */
export const getMembersByRole = (role) => {
  switch (role) {
    case 'developer':
      return memberConfiguration.developers
    case 'qa':
      return memberConfiguration.qa
    default:
      return []
  }
}

/**
 * Get all configured severities
 * @returns {Array} - Array of severity levels
 */
export const getAllConfiguredSeverities = () => {
  return memberConfiguration.severities || []
}

/**
 * Get member names by role
 * @param {string} role - 'developer' or 'qa'
 * @returns {Array} - Array of member names for the specified role
 */
export const getMemberNamesByRole = (role) => {
  switch (role) {
    case 'developer':
      return memberConfiguration.developers.map(dev => dev.name)
    case 'qa':
      return memberConfiguration.qa.map(qa => qa.name)
    default:
      return []
  }
}

/**
 * Validate configuration
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export const validateConfiguration = () => {
  const errors = []
  
  // Check for duplicate names across roles
  const developerNames = memberConfiguration.developers.map(dev => dev.name)
  const qaNames = memberConfiguration.qa.map(qa => qa.name)
  const duplicateNames = developerNames.filter(name => qaNames.includes(name))
  
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate member names found in both developers and qa arrays: ${duplicateNames.join(', ')}`)
  }
  
  // Check for duplicate jiraIds across roles
  const developerIds = memberConfiguration.developers.map(dev => dev.jiraId).filter(id => id)
  const qaIds = memberConfiguration.qa.map(qa => qa.jiraId).filter(id => id)
  const duplicateIds = developerIds.filter(id => qaIds.includes(id))
  
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate JIRA IDs found in both developers and qa arrays: ${duplicateIds.join(', ')}`)
  }
  
  // Check for duplicate jiraIds within same role
  const duplicateDevIds = developerIds.filter((id, index) => developerIds.indexOf(id) !== index)
  const duplicateQaIds = qaIds.filter((id, index) => qaIds.indexOf(id) !== index)
  
  if (duplicateDevIds.length > 0) {
    errors.push(`Duplicate JIRA IDs found within developers array: ${duplicateDevIds.join(', ')}`)
  }
  
  if (duplicateQaIds.length > 0) {
    errors.push(`Duplicate JIRA IDs found within qa array: ${duplicateQaIds.join(', ')}`)
  }
  
  // Check for missing required fields
  memberConfiguration.developers.forEach((dev, index) => {
    if (!dev.name) {
      errors.push(`Developer at index ${index} is missing 'name' field`)
    }
    if (!dev.jiraId) {
      errors.push(`Developer at index ${index} is missing 'jiraId' field`)
    }
  })
  
  memberConfiguration.qa.forEach((qa, index) => {
    if (!qa.name) {
      errors.push(`QA member at index ${index} is missing 'name' field`)
    }
    if (!qa.jiraId) {
      errors.push(`QA member at index ${index} is missing 'jiraId' field`)
    }
  })
  
  // Check for empty arrays when onlyCalculateForConfiguredMembers is true
  if (memberConfiguration.kpiSettings.onlyCalculateForConfiguredMembers) {
    if (memberConfiguration.developers.length === 0 && memberConfiguration.qa.length === 0) {
      errors.push('No members configured, but onlyCalculateForConfiguredMembers is true')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}