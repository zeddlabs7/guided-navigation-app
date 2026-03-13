export interface LocaleMessages {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    done: string;
    confirm: string;
    close: string;
  };
  auth: {
    login: string;
    logout: string;
    email: string;
    phone: string;
    sendCode: string;
    verifyCode: string;
  };
  guidance: {
    title: string;
    createNew: string;
    editGuidance: string;
    deleteGuidance: string;
    publish: string;
    unpublish: string;
    preview: string;
    steps: string;
    addStep: string;
    deleteStep: string;
    reorderSteps: string;
    stepOf: string;
    noGuidance: string;
  };
  availability: {
    title: string;
    anytimeToday: string;
    timeWindow: string;
    notAvailable: string;
    setAvailability: string;
  };
  shareLink: {
    title: string;
    generate: string;
    regenerate: string;
    revoke: string;
    copy: string;
    copied: string;
    expires: string;
    expired: string;
    active: string;
  };
  courier: {
    followSteps: string;
    cantFindStep: string;
    openInMaps: string;
    deliveryComplete: string;
    linkExpired: string;
    linkRevoked: string;
    linkInvalid: string;
  };
  feedback: {
    title: string;
    whyCantFind: string;
    wrongPhoto: string;
    unclearDirection: string;
    missingStep: string;
    locationConfusing: string;
    other: string;
    submit: string;
    thankYou: string;
  };
  stepTypes: {
    PIN_CHECK: string;
    APPROACH: string;
    GATE_ENTRY: string;
    WALK_PATH: string;
    TURN: string;
    STAIRS: string;
    ELEVATOR: string;
    LANDMARK: string;
    DOOR_ENTRY: string;
    RECEPTION: string;
    DROPOFF_POINT: string;
  };
}
