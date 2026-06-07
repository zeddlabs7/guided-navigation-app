import type { Language } from '@guidenav/types';

type TranslationKey =
  // AddressDetailsSection
  | 'villa'
  | 'apartment'
  | 'floor'
  | 'door'
  | 'destination'
  | 'noAddressDetails'
  | 'locationPhoto'
  | 'getDirections'
  | 'arrivalSteps'
  // StepListSection
  | 'guide'
  | 'deliverySteps'
  | 'tapStepHint'
  | 'noAdditionalSteps'
  | 'backToTop'
  | 'noInstructions'
  // GuidedPlaybackPage
  | 'back'
  | 'home'
  | 'noImage'
  | 'annotationOnPhoto'
  | 'step'
  | 'of'
  | 'cantFindStep'
  | 'previous'
  | 'next'
  | 'youveArrived'
  // CompletePage
  | 'dropOffPoint'
  | 'finalStepReached'
  | 'deliveryConfirmed'
  | 'reachedDropOff'
  | 'thankYou'
  | 'confirmBelow'
  | 'confirming'
  | 'confirmDelivery'
  | 'whatsappHint'
  | 'contactRecipient'
  // ErrorPage
  | 'close'
  | 'tryAgain'
  // FeedbackModal
  | 'whatIsTheIssue'
  | 'submitting'
  | 'submitReport'
  | 'photoUnclear'
  | 'noVisibleLandmark'
  | 'gateClosed'
  | 'incorrectPin'
  | 'other'
  // Error messages
  | 'errorExpiredTitle'
  | 'errorExpiredMessage'
  | 'errorExpiredStatus'
  | 'errorRevokedTitle'
  | 'errorRevokedMessage'
  | 'errorRevokedStatus'
  | 'errorNotFoundTitle'
  | 'errorNotFoundMessage'
  | 'errorNotFoundStatus'
  | 'errorDisabledTitle'
  | 'errorDisabledMessage'
  | 'errorDisabledStatus'
  | 'errorNoStepsTitle'
  | 'errorNoStepsMessage'
  | 'errorNoStepsStatus'
  | 'errorLoadFailedTitle'
  | 'errorLoadFailedMessage'
  | 'errorLoadFailedStatus'
  | 'errorDefaultTitle'
  | 'errorDefaultMessage'
  | 'errorDefaultStatus'
  // Welcome page
  | 'selectLanguage'
  | 'clickToSeeDetails'
  // Misc
  | 'loading';

const translations: Record<TranslationKey, Record<Language, string>> = {
  // AddressDetailsSection
  villa: { en: 'Villa', ar: 'فيلا', hi: 'विला', ur: 'ولا', bn: 'ভিলা' },
  apartment: { en: 'Apartment', ar: 'شقة', hi: 'अपार्टमेंट', ur: 'اپارٹمنٹ', bn: 'অ্যাপার্টমেন্ট' },
  floor: { en: 'Floor', ar: 'طابق', hi: 'मंज़िल', ur: 'منزل', bn: 'তলা' },
  door: { en: 'Door', ar: 'باب', hi: 'दरवाज़ा', ur: 'دروازہ', bn: 'দরজা' },
  destination: { en: 'Destination', ar: 'الوجهة', hi: 'गंतव्य', ur: 'منزل مقصود', bn: 'গন্তব্য' },
  noAddressDetails: { en: 'No additional address details provided', ar: 'لا توجد تفاصيل إضافية للعنوان', hi: 'कोई अतिरिक्त पता विवरण नहीं', ur: 'کوئی اضافی پتے کی تفصیلات نہیں', bn: 'কোনো অতিরিক্ত ঠিকানার বিবরণ নেই' },
  locationPhoto: { en: 'Location photo', ar: 'صورة الموقع', hi: 'स्थान की फोटो', ur: 'مقام کی تصویر', bn: 'অবস্থানের ছবি' },
  getDirections: { en: 'Get Directions', ar: 'احصل على الاتجاهات', hi: 'दिशा-निर्देश प्राप्त करें', ur: 'سمت حاصل کریں', bn: 'দিকনির্দেশ পান' },
  arrivalSteps: { en: 'Arrival Steps', ar: 'خطوات الوصول', hi: 'आगमन चरण', ur: 'پہنچنے کے مراحل', bn: 'আগমনের ধাপ' },

  // StepListSection
  guide: { en: 'Guide', ar: 'الدليل', hi: 'गाइड', ur: 'گائیڈ', bn: 'গাইড' },
  deliverySteps: { en: 'Delivery steps', ar: 'خطوات التوصيل', hi: 'डिलीवरी चरण', ur: 'ڈیلیوری کے مراحل', bn: 'ডেলিভারি ধাপ' },
  tapStepHint: { en: 'Tap a step to view detailed instructions', ar: 'اضغط على خطوة لعرض التعليمات التفصيلية', hi: 'विस्तृत निर्देश देखने के लिए एक चरण पर टैप करें', ur: 'تفصیلی ہدایات دیکھنے کے لیے ایک مرحلے پر ٹیپ کریں', bn: 'বিস্তারিত নির্দেশনা দেখতে একটি ধাপে ট্যাপ করুন' },
  noAdditionalSteps: { en: 'No additional steps', ar: 'لا توجد خطوات إضافية', hi: 'कोई अतिरिक्त चरण नहीं', ur: 'کوئی اضافی مراحل نہیں', bn: 'কোনো অতিরিক্ত ধাপ নেই' },
  backToTop: { en: 'Back to Top', ar: 'العودة للأعلى', hi: 'ऊपर वापस जाएं', ur: 'اوپر واپس جائیں', bn: 'উপরে ফিরে যান' },
  noInstructions: { en: 'No instructions', ar: 'لا توجد تعليمات', hi: 'कोई निर्देश नहीं', ur: 'کوئی ہدایات نہیں', bn: 'কোনো নির্দেশনা নেই' },

  // GuidedPlaybackPage
  back: { en: 'Back', ar: 'رجوع', hi: 'वापस', ur: 'واپس', bn: 'পিছনে' },
  home: { en: 'Home', ar: 'الرئيسية', hi: 'होम', ur: 'ہوم', bn: 'হোম' },
  noImage: { en: 'No image', ar: 'لا توجد صورة', hi: 'कोई छवि नहीं', ur: 'کوئی تصویر نہیں', bn: 'কোনো ছবি নেই' },
  annotationOnPhoto: { en: 'annotation on photo', ar: 'تعليق توضيحية على الصورة', hi: 'फोटो पर एनोटेशन', ur: 'تصویر پر نوٹ', bn: 'ছবিতে টীকা' },
  step: { en: 'Step', ar: 'الخطوة', hi: 'चरण', ur: 'مرحلہ', bn: 'ধাপ' },
  of: { en: 'of', ar: 'من', hi: 'का', ur: 'میں سے', bn: 'এর মধ্যে' },
  cantFindStep: { en: "I can't find this step", ar: 'لا أجد هذه الخطوة', hi: 'मुझे यह चरण नहीं मिल रहा', ur: 'مجھے یہ مرحلہ نہیں مل رہا', bn: 'আমি এই ধাপটি খুঁজে পাচ্ছি না' },
  previous: { en: 'Previous', ar: 'السابق', hi: 'पिछला', ur: 'پچھلا', bn: 'পূর্ববর্তী' },
  next: { en: 'Next', ar: 'التالي', hi: 'अगला', ur: 'اگلا', bn: 'পরবর্তী' },
  youveArrived: { en: "You've Arrived", ar: 'وصلت', hi: 'आप पहुंच गए', ur: 'آپ پہنچ گئے', bn: 'আপনি পৌঁছে গেছেন' },

  // CompletePage
  dropOffPoint: { en: 'Drop-off Point', ar: 'نقطة التسليم', hi: 'डिलीवरी पॉइंट', ur: 'ڈیلیوری پوائنٹ', bn: 'ডেলিভারি পয়েন্ট' },
  finalStepReached: { en: 'Final step reached', ar: 'الخطوة الأخيرة', hi: 'अंतिम चरण पूरा', ur: 'آخری مرحلہ مکمل', bn: 'চূড়ান্ত ধাপে পৌঁছেছেন' },
  deliveryConfirmed: { en: 'Delivery Confirmed!', ar: 'تم تأكيد التوصيل!', hi: 'डिलीवरी की पुष्टि!', ur: 'ڈیلیوری کی تصدیق!', bn: 'ডেলিভারি নিশ্চিত!' },
  reachedDropOff: { en: 'You have reached the drop-off point.', ar: 'لقد وصلت إلى نقطة التسليم.', hi: 'आप डिलीवरी पॉइंट पर पहुंच गए हैं।', ur: 'آپ ڈیلیوری پوائنٹ پر پہنچ گئے ہیں۔', bn: 'আপনি ডেলিভারি পয়েন্টে পৌঁছেছেন।' },
  thankYou: { en: 'Thank you for using Arriveo.', ar: 'شكرًا لك على استخدام Arriveo.', hi: 'Arriveo का उपयोग करने के लिए धन्यवाद।', ur: 'Arriveo استعمال کرنے کا شکریہ۔', bn: 'Arriveo ব্যবহার করার জন্য ধন্যবাদ।' },
  confirmBelow: { en: 'Please confirm your delivery below.', ar: 'يرجى تأكيد التوصيل أدناه.', hi: 'कृपया नीचे अपनी डिलीवरी की पुष्टि करें।', ur: 'براہ کرم نیچے اپنی ڈیلیوری کی تصدیق کریں۔', bn: 'অনুগ্রহ করে নিচে আপনার ডেলিভারি নিশ্চিত করুন।' },
  confirming: { en: 'Confirming...', ar: 'جاري التأكيد...', hi: 'पुष्टि हो रही है...', ur: 'تصدیق ہو رہی ہے...', bn: 'নিশ্চিত হচ্ছে...' },
  confirmDelivery: { en: 'Confirm Delivery', ar: 'تأكيد التوصيل', hi: 'डिलीवरी की पुष्टि करें', ur: 'ڈیلیوری کی تصدیق کریں', bn: 'ডেলিভারি নিশ্চিত করুন' },
  whatsappHint: { en: 'This will open WhatsApp to send a delivery photo to the recipient', ar: 'سيفتح واتساب لإرسال صورة التوصيل للمستلم', hi: 'यह प्राप्तकर्ता को डिलीवरी फोटो भेजने के लिए WhatsApp खोलेगा', ur: 'یہ وصول کنندہ کو ڈیلیوری فوٹو بھیجنے کے لیے WhatsApp کھولے گا', bn: 'এটি প্রাপককে ডেলিভারি ফটো পাঠাতে WhatsApp খুলবে' },
  contactRecipient: { en: 'Contact Recipient', ar: 'تواصل مع المستلم', hi: 'प्राप्तकर्ता से संपर्क करें', ur: 'وصول کنندہ سے رابطہ کریں', bn: 'প্রাপকের সাথে যোগাযোগ করুন' },

  // ErrorPage / FeedbackModal
  close: { en: 'Close', ar: 'إغلاق', hi: 'बंद करें', ur: 'بند کریں', bn: 'বন্ধ করুন' },
  tryAgain: { en: 'Try again', ar: 'حاول مرة أخرى', hi: 'पुनः प्रयास करें', ur: 'دوبارہ کوشش کریں', bn: 'আবার চেষ্টা করুন' },
  whatIsTheIssue: { en: 'What seems to be the issue?', ar: 'ما هي المشكلة؟', hi: 'समस्या क्या है?', ur: 'مسئلہ کیا ہے؟', bn: 'সমস্যা কী?' },
  submitting: { en: 'Submitting...', ar: 'جاري الإرسال...', hi: 'जमा हो रहा है...', ur: 'جمع ہو رہا ہے...', bn: 'জমা হচ্ছে...' },
  submitReport: { en: 'Submit Report', ar: 'إرسال التقرير', hi: 'रिपोर्ट जमा करें', ur: 'رپورٹ جمع کریں', bn: 'রিপোর্ট জমা দিন' },
  photoUnclear: { en: 'Photo unclear', ar: 'الصورة غير واضحة', hi: 'फोटो अस्पष्ट', ur: 'تصویر واضح نہیں', bn: 'ছবি অস্পষ্ট' },
  noVisibleLandmark: { en: 'No visible landmark', ar: 'لا يوجد معلم مرئي', hi: 'कोई दृश्य लैंडमार्क नहीं', ur: 'کوئی نظر آنے والا نشان نہیں', bn: 'কোনো দৃশ্যমান ল্যান্ডমার্ক নেই' },
  gateClosed: { en: 'Gate closed', ar: 'البوابة مغلقة', hi: 'गेट बंद', ur: 'گیٹ بند', bn: 'গেট বন্ধ' },
  incorrectPin: { en: 'Incorrect PIN', ar: 'رقم PIN غير صحيح', hi: 'गलत पिन', ur: 'غلط پن', bn: 'ভুল পিন' },
  other: { en: 'Other', ar: 'أخرى', hi: 'अन्य', ur: 'دیگر', bn: 'অন্যান্য' },

  // Error messages
  errorExpiredTitle: { en: 'This guidance link has expired.', ar: 'انتهت صلاحية رابط الإرشاد هذا.', hi: 'इस मार्गदर्शन लिंक की समय सीमा समाप्त हो गई है।', ur: 'اس رہنمائی لنک کی میعاد ختم ہو گئی ہے۔', bn: 'এই গাইডেন্স লিঙ্কের মেয়াদ শেষ হয়ে গেছে।' },
  errorExpiredMessage: { en: 'The sender may have disabled or removed this guidance. Please contact the recipient for an updated link.', ar: 'ربما قام المرسل بتعطيل أو إزالة هذا الإرشاد. يرجى الاتصال بالمستلم للحصول على رابط محدث.', hi: 'प्रेषक ने इस मार्गदर्शन को अक्षम या हटा दिया हो सकता है। कृपया अपडेटेड लिंक के लिए प्राप्तकर्ता से संपर्क करें।', ur: 'بھیجنے والے نے اس رہنمائی کو غیر فعال یا ہٹا دیا ہو سکتا ہے۔ براہ کرم اپ ڈیٹ لنک کے لیے وصول کنندہ سے رابطہ کریں۔', bn: 'প্রেরক এই গাইডেন্স নিষ্ক্রিয় বা সরিয়ে দিয়ে থাকতে পারেন। আপডেট লিঙ্কের জন্য প্রাপকের সাথে যোগাযোগ করুন।' },
  errorExpiredStatus: { en: 'Link status: Expired', ar: 'حالة الرابط: منتهي الصلاحية', hi: 'लिंक स्थिति: समाप्त', ur: 'لنک کی حالت: ختم شدہ', bn: 'লিঙ্কের অবস্থা: মেয়াদ শেষ' },
  errorRevokedTitle: { en: 'This guidance link has been revoked.', ar: 'تم إلغاء رابط الإرشاد هذا.', hi: 'इस मार्गदर्शन लिंक को रद्द कर दिया गया है।', ur: 'اس رہنمائی لنک کو منسوخ کر دیا گیا ہے۔', bn: 'এই গাইডেন্স লিঙ্কটি প্রত্যাহার করা হয়েছে।' },
  errorRevokedMessage: { en: 'The sender has revoked access to this guidance. Please contact the recipient for a new link.', ar: 'قام المرسل بإلغاء الوصول إلى هذا الإرشاد. يرجى الاتصال بالمستلم للحصول على رابط جديد.', hi: 'प्रेषक ने इस मार्गदर्शन तक पहुंच रद्द कर दी है। कृपया नए लिंक के लिए प्राप्तकर्ता से संपर्क करें।', ur: 'بھیجنے والے نے اس رہنمائی تک رسائی منسوخ کر دی ہے۔ براہ کرم نئے لنک کے لیے وصول کنندہ سے رابطہ کریں۔', bn: 'প্রেরক এই গাইডেন্সে অ্যাক্সেস প্রত্যাহার করেছেন। নতুন লিঙ্কের জন্য প্রাপকের সাথে যোগাযোগ করুন।' },
  errorRevokedStatus: { en: 'Link status: Revoked', ar: 'حالة الرابط: ملغى', hi: 'लिंक स्थिति: रद्द', ur: 'لنک کی حالت: منسوخ', bn: 'লিঙ্কের অবস্থা: প্রত্যাহৃত' },
  errorNotFoundTitle: { en: 'Invalid guidance link.', ar: 'رابط إرشاد غير صالح.', hi: 'अमान्य मार्गदर्शन लिंक।', ur: 'غلط رہنمائی لنک۔', bn: 'অবৈধ গাইডেন্স লিঙ্ক।' },
  errorNotFoundMessage: { en: 'This link does not exist or has been removed. Check your link and try again.', ar: 'هذا الرابط غير موجود أو تمت إزالته. تحقق من الرابط وحاول مرة أخرى.', hi: 'यह लिंक मौजूद नहीं है या हटा दिया गया है। अपना लिंक जांचें और पुनः प्रयास करें।', ur: 'یہ لنک موجود نہیں ہے یا ہٹا دیا گیا ہے۔ اپنا لنک چیک کریں اور دوبارہ کوشش کریں۔', bn: 'এই লিঙ্কটি বিদ্যমান নেই বা সরানো হয়েছে। আপনার লিঙ্ক পরীক্ষা করুন এবং আবার চেষ্টা করুন।' },
  errorNotFoundStatus: { en: 'Link status: Invalid', ar: 'حالة الرابط: غير صالح', hi: 'लिंक स्थिति: अमान्य', ur: 'لنک کی حالت: غلط', bn: 'লিঙ্কের অবস্থা: অবৈধ' },
  errorDisabledTitle: { en: 'This guidance is currently disabled.', ar: 'هذا الإرشاد معطل حاليًا.', hi: 'यह मार्गदर्शन वर्तमान में अक्षम है।', ur: 'یہ رہنمائی فی الحال غیر فعال ہے۔', bn: 'এই গাইডেন্স বর্তমানে নিষ্ক্রিয়।' },
  errorDisabledMessage: { en: 'The sender has temporarily disabled this guidance. Please contact the recipient.', ar: 'قام المرسل بتعطيل هذا الإرشاد مؤقتًا. يرجى الاتصال بالمستلم.', hi: 'प्रेषक ने इस मार्गदर्शन को अस्थायी रूप से अक्षम कर दिया है। कृपया प्राप्तकर्ता से संपर्क करें।', ur: 'بھیجنے والے نے اس رہنمائی کو عارضی طور پر غیر فعال کر دیا ہے۔ براہ کرم وصول کنندہ سے رابطہ کریں۔', bn: 'প্রেরক এই গাইডেন্স সাময়িকভাবে নিষ্ক্রিয় করেছেন। প্রাপকের সাথে যোগাযোগ করুন।' },
  errorDisabledStatus: { en: 'Link status: Disabled', ar: 'حالة الرابط: معطل', hi: 'लिंक स्थिति: अक्षम', ur: 'لنک کی حالت: غیر فعال', bn: 'লিঙ্কের অবস্থা: নিষ্ক্রিয়' },
  errorNoStepsTitle: { en: 'No steps available.', ar: 'لا توجد خطوات متاحة.', hi: 'कोई चरण उपलब्ध नहीं।', ur: 'کوئی مراحل دستیاب نہیں۔', bn: 'কোনো ধাপ উপলব্ধ নেই।' },
  errorNoStepsMessage: { en: 'This guidance has no steps configured yet. Please contact the recipient.', ar: 'لم يتم تكوين أي خطوات لهذا الإرشاد بعد. يرجى الاتصال بالمستلم.', hi: 'इस मार्गदर्शन में अभी तक कोई चरण कॉन्फ़िगर नहीं किया गया है। कृपया प्राप्तकर्ता से संपर्क करें।', ur: 'اس رہنمائی میں ابھی تک کوئی مراحل ترتیب نہیں دیے گئے ہیں۔ براہ کرم وصول کنندہ سے رابطہ کریں۔', bn: 'এই গাইডেন্সে এখনো কোনো ধাপ কনফিগার করা হয়নি। প্রাপকের সাথে যোগাযোগ করুন।' },
  errorNoStepsStatus: { en: 'Link status: Incomplete', ar: 'حالة الرابط: غير مكتمل', hi: 'लिंक स्थिति: अपूर्ण', ur: 'لنک کی حالت: نامکمل', bn: 'লিঙ্কের অবস্থা: অসম্পূর্ণ' },
  errorLoadFailedTitle: { en: 'Something went wrong.', ar: 'حدث خطأ ما.', hi: 'कुछ गलत हो गया।', ur: 'کچھ غلط ہو گیا۔', bn: 'কিছু ভুল হয়েছে।' },
  errorLoadFailedMessage: { en: 'We could not load the guidance. Please check your connection and try again.', ar: 'لم نتمكن من تحميل الإرشاد. يرجى التحقق من الاتصال والمحاولة مرة أخرى.', hi: 'हम मार्गदर्शन लोड नहीं कर सके। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।', ur: 'ہم رہنمائی لوڈ نہیں کر سکے۔ براہ کرم اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔', bn: 'আমরা গাইডেন্স লোড করতে পারিনি। অনুগ্রহ করে আপনার সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।' },
  errorLoadFailedStatus: { en: 'Link status: Error', ar: 'حالة الرابط: خطأ', hi: 'लिंक स्थिति: त्रुटि', ur: 'لنک کی حالت: خرابی', bn: 'লিঙ্কের অবস্থা: ত্রুটি' },
  errorDefaultTitle: { en: 'Something went wrong.', ar: 'حدث خطأ ما.', hi: 'कुछ गलत हो गया।', ur: 'کچھ غلط ہو گیا۔', bn: 'কিছু ভুল হয়েছে।' },
  errorDefaultMessage: { en: 'We could not load the guidance. Please try again or contact the sender.', ar: 'لم نتمكن من تحميل الإرشاد. يرجى المحاولة مرة أخرى أو الاتصال بالمرسل.', hi: 'हम मार्गदर्शन लोड नहीं कर सके। कृपया पुनः प्रयास करें या प्रेषक से संपर्क करें।', ur: 'ہم رہنمائی لوڈ نہیں کر سکے۔ براہ کرم دوبارہ کوشش کریں یا بھیجنے والے سے رابطہ کریں۔', bn: 'আমরা গাইডেন্স লোড করতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন বা প্রেরকের সাথে যোগাযোগ করুন।' },
  errorDefaultStatus: { en: 'Link status: Error', ar: 'حالة الرابط: خطأ', hi: 'लिंक स्थिति: त्रुटि', ur: 'لنک کی حالت: خرابی', bn: 'লিঙ্কের অবস্থা: ত্রুটি' },

  // Welcome
  selectLanguage: { en: 'Select Language', ar: 'اختر اللغة', hi: 'भाषा चुनें', ur: 'زبان منتخب کریں', bn: 'ভাষা নির্বাচন করুন' },
  clickToSeeDetails: { en: 'Click to see location details', ar: 'انقر لرؤية تفاصيل الموقع', hi: 'स्थान विवरण देखने के लिए क्लिक करें', ur: 'مقام کی تفصیلات دیکھنے کے لیے کلک کریں', bn: 'অবস্থানের বিবরণ দেখতে ক্লিক করুন' },

  // Misc
  loading: { en: 'Loading Arriveo...', ar: '...جاري التحميل', hi: 'Arriveo लोड हो रहा है...', ur: '...Arriveo لوڈ ہو رہا ہے', bn: 'Arriveo লোড হচ্ছে...' },
};

export type { TranslationKey };
export default translations;
