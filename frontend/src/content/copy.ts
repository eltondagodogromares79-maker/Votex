/**
 * UI copy — all user-facing strings live here.
 * Components read from this file. Never write user-visible text inline in JSX.
 */

export const COPY = {
  app: {
    name: "Votex",
    tagline: "Pageant Management, Reimagined.",
  },

  nav: {
    login: "Log In",
    register: "Get Started",
    getStarted: "Get Started Free",
    dashboard: "Dashboard",
    logout: "Log Out",
    logoutAll: "Log Out All Devices",
  },

  auth: {
    // ── Login ─────────────────────────────────────────────────────────────
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to your Votex account",
    loginButton: "Sign in",

    // ── Registration ──────────────────────────────────────────────────────
    // Registration creates a Coordinator account (+ organization).
    // "Organization Owner" is an internal backend concept — never shown to users.
    registerTitle: "Set up your account",
    registerSubtitle: "Create your Coordinator account and pageant organization",
    registerButton: "Create account",

    // ── Field labels & placeholders ───────────────────────────────────────
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    newPasswordPlaceholder: "Create a strong password",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Re-enter your password",
    firstNameLabel: "First name",
    firstNamePlaceholder: "Juan",
    middleNameLabel: "Middle name",
    middleNamePlaceholder: "Optional",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Cruz",
    displayNameLabel: "Display name",
    displayNamePlaceholder: "Juan dela Cruz",
    phoneLabel: "Phone number (optional)",
    phonePlaceholder: "+639171234567",
    organizationNameLabel: "Organization name",
    organizationNamePlaceholder: "e.g. Manila Pageant Organization",
    organizationSlugLabel: "Organization URL slug",
    organizationSlugPlaceholder: "e.g. manila-pageant-org",
    organizationSlugHint: "Used in your organization's URL. Lowercase letters, numbers, and hyphens.",

    // ── Auth actions ──────────────────────────────────────────────────────
    continueWithGoogle: "Continue with Google",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    forgotPassword: "Forgot password?",

    // ── Terms ─────────────────────────────────────────────────────────────
    termsLabel: "I agree to the",
    termsAnd: "and",

    // ── Password strength ─────────────────────────────────────────────────
    passwordStrengthWeak: "Weak",
    passwordStrengthFair: "Fair",
    passwordStrengthGood: "Good",
    passwordStrengthStrong: "Strong",

    // ── Forgot password ───────────────────────────────────────────────────
    forgotPasswordTitle: "Reset your password",
    forgotPasswordSubtitle: "Enter your email and we'll send you a reset link.",
    forgotPasswordButton: "Send reset link",
    forgotPasswordSuccess: "Check your inbox for a reset link.",
    backToSignIn: "Back to sign in",

    // ── Misc ──────────────────────────────────────────────────────────────
    heroTagline: "Run every pageant with precision & elegance.",
    heroSubtext: "Live scoring, real-time tabulation, and results you can trust — all in one platform.",
  },

  pageants: {
    title: "My Pageants",
    createButton: "New Pageant",
    editButton: "Edit",
    deleteButton: "Delete",
    deleteConfirm: "Are you sure you want to delete this pageant? This cannot be undone.",
    namePlaceholder: "e.g. Miss Universe 2026",
    taglinePlaceholder: "A short tagline for the event",
    locationPlaceholder: "e.g. Manila, Philippines",
    coverImagePlaceholder: "https://example.com/cover.jpg",
    emptyTitle: "No pageants yet",
    emptyDescription: "Create your first pageant to get started.",
    emptyAction: "Create Pageant",
  },

  candidates: {
    title: "Candidates",
    addButton: "Add Candidate",
    editButton: "Edit",
    deleteButton: "Remove",
    statusButton: "Update Status",
    numberLabel: "Candidate Number",
    numberPlaceholder: "e.g. 01",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "e.g. Maria Santos",
    representingLabel: "Representing",
    representingPlaceholder: "e.g. Manila",
    genderLabel: "Gender",
    photoUrlLabel: "Photo URL",
    photoUrlPlaceholder: "https://example.com/photo.jpg",
    emptyTitle: "No candidates added",
    emptyDescription: "Add candidates to this pageant to get started.",
    emptyAction: "Add Candidate",
  },

  judges: {
    title: "Judges",
    addButton: "Add Judge",
    removeButton: "Remove",
    regenerateCode: "Regenerate Code",
    emailLabel: "Email address",
    emailPlaceholder: "judge@example.com",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Judge full name",
    codeLabel: "Login Code",
    codeCopied: "Code copied!",
    copyCode: "Copy Code",
    emptyTitle: "No judges assigned",
    emptyDescription: "Add judges to this pageant. They will receive a login code.",
    emptyAction: "Add Judge",
  },

  tabulators: {
    title: "Tabulators",
    addButton: "Add Tabulator",
    removeButton: "Remove",
    regenerateCode: "Regenerate Code",
    emailLabel: "Email address",
    emailPlaceholder: "tabulator@example.com",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Tabulator full name",
    emptyTitle: "No tabulators assigned",
    emptyDescription: "Add tabulators to monitor and finalize scores.",
    emptyAction: "Add Tabulator",
  },

  categories: {
    title: "Categories",
    addButton: "Add Category",
    editButton: "Edit",
    deleteButton: "Delete",
    addCriterion: "Add Criterion",
    nameLabel: "Category Name",
    namePlaceholder: "e.g. Swimwear",
    genderLabel: "Applicable Gender",
    criterionNameLabel: "Criterion Name",
    criterionNamePlaceholder: "e.g. Stage Presence",
    criterionWeightLabel: "Weight (%)",
    criterionWeightPlaceholder: "e.g. 25",
    criterionOrderLabel: "Display Order",
    emptyTitle: "No categories yet",
    emptyDescription: "Add scoring categories and criteria.",
    emptyAction: "Add Category",
  },

  rounds: {
    title: "Rounds",
    addButton: "Add Round",
    editButton: "Edit",
    deleteButton: "Delete",
    labelLabel: "Round Label",
    labelPlaceholder: "e.g. Preliminary Round",
    noteLabel: "Notes (optional)",
    notePlaceholder: "Any notes for this round",
    statusLabel: "Status",
    emptyTitle: "No rounds yet",
    emptyDescription: "Add rounds to structure the judging process.",
    emptyAction: "Add Round",
  },

  scoring: {
    submitButton: "Submit Score",
    updateButton: "Update Score",
    submitting: "Submitting…",
    submitted: "Submitted",
    scoreLabel: "Score (0–100)",
    allSubmitted: "All scores submitted",
    progressLabel: (done: number, total: number) => `${done} of ${total} scored`,
  },

  tabulation: {
    title: "Live Tabulation",
    advanceButton: "Advance Selected",
    advancing: "Advancing…",
    leaderboardTitle: "Leaderboard",
    refreshButton: "Refresh",
    reconnecting: "Reconnecting…",
    disconnected: "Connection lost. Trying to reconnect.",
  },

  billing: {
    title: "Billing & Subscription",
    currentPlan: "Current Plan",
    noPlan: "No active subscription",
    noPlanDescription: "Purchase a plan to start creating pageants.",
    choosePlan: "Choose a Plan",
    pageantUsage: (used: number, limit: number) =>
      `${used} of ${limit} pageants used`,
    manualPaymentTitle: "Pay via Bank Transfer / GCash",
    checkoutTitle: "Pay Online via PayMongo",
    referenceLabel: "Reference Number",
    referencePlaceholder: "e.g. 9876543210",
    screenshotLabel: "Payment Screenshot URL (optional)",
    screenshotPlaceholder: "https://example.com/screenshot.png",
    submitPayment: "Submit Payment",
    submitting: "Submitting…",
    payOnline: "Pay Online",
    paymentHistory: "Payment History",
    emptyHistory: "No payment requests yet.",
  },

  errors: {
    generic: "Something went wrong. Please try again.",
    notFound: "We couldn't find what you were looking for.",
    unauthorized: "You don't have permission to view this page.",
    sessionExpired: "Your session has expired. Please sign in again.",
    networkError: "Network error. Check your connection and try again.",
    validationFailed: "Please correct the errors below.",
  },

  actions: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    deleting: "Deleting…",
    edit: "Edit",
    add: "Add",
    close: "Close",
    back: "Back",
    next: "Next",
    retry: "Try again",
    goHome: "Go to Dashboard",
  },
} as const;
