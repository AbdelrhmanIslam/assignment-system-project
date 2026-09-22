/**
 * Universal Internationalization (i18n) & Localization (l10n) Engine
 * Assignment System - English & Arabic Bilingual Manager
 */

(function (window, document) {
    'use strict';

    var STORAGE_KEY = 'assignment_system_lang';
    var COOKIE_NAME = 'assignment_system_lang';
    var DEFAULT_LANG = 'en';

    // SVG Globe Icon for Language Toggle Button
    var GLOBE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';

    var catalogs = {
        en: null,
        ar: null
    };

    // Determine current language from localStorage / cookie with fallback to 'en'
    function getStoredLanguage() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'en' || stored === 'ar') {
                return stored;
            }
            // Check cookie
            var match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
            if (match && (match[2] === 'en' || match[2] === 'ar')) {
                return match[2];
            }
        } catch (e) {
            // Ignore security/localStorage errors
        }
        return DEFAULT_LANG;
    }

    var currentLang = getStoredLanguage();

    // Immediately set html lang and dir attributes to prevent layout flash
    function applyDocumentDirection(lang) {
        var dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', dir);
    }

    applyDocumentDirection(currentLang);

    // Save language to localStorage and cookie
    function persistLanguage(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
            var expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            document.cookie = COOKIE_NAME + '=' + lang + '; path=/; expires=' + expires.toUTCString() + '; SameSite=Lax';
        } catch (e) {
            // Ignore storage errors
        }
    }

    // Resolve nested object path: getNestedValue(obj, 'nav.dashboard')
    function getNestedValue(obj, path) {
        if (!obj || !path) return null;
        var parts = path.split('.');
        var current = obj;
        for (var i = 0; i < parts.length; i++) {
            if (current && typeof current === 'object' && parts[i] in current) {
                current = current[parts[i]];
            } else {
                return null;
            }
        }
        return (typeof current === 'string') ? current : null;
    }

    // Load JSON catalogs
    function loadCatalogs(callback) {
        if (catalogs.en && catalogs.ar) {
            if (callback) callback();
            return;
        }

        // Determine base path to assets/i18n/
        var scripts = document.getElementsByTagName('script');
        var basePath = '';
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src') || '';
            if (src.indexOf('i18n.js') !== -1) {
                basePath = src.substring(0, src.lastIndexOf('js/i18n.js'));
                break;
            }
        }
        if (!basePath) {
            basePath = '../assets/';
        }

        var enUrl = basePath + 'i18n/en.json';
        var arUrl = basePath + 'i18n/ar.json';

        var pEn = fetch(enUrl).then(function (r) { return r.json(); }).catch(function () { return {}; });
        var pAr = fetch(arUrl).then(function (r) { return r.json(); }).catch(function () { return {}; });

        Promise.all([pEn, pAr]).then(function (results) {
            catalogs.en = results[0] || {};
            catalogs.ar = results[1] || {};
            if (callback) callback();
        }).catch(function () {
            catalogs.en = catalogs.en || {};
            catalogs.ar = catalogs.ar || {};
            if (callback) callback();
        });
    }

    // Translation lookup: i18n.t('common.save', { count: 5 })
    function t(key, params, fallback) {
        if (!key) return '';
        var activeCatalog = catalogs[currentLang] || {};
        var enCatalog = catalogs.en || {};

        var val = getNestedValue(activeCatalog, key);
        if (!val) {
            val = getNestedValue(enCatalog, key);
        }
        if (!val) {
            val = (fallback !== undefined) ? fallback : key;
        }

        if (params && typeof params === 'object') {
            for (var p in params) {
                if (params.hasOwnProperty(p)) {
                    val = val.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
                }
            }
        }
        return val;
    }

    // Canonical DB Enum Lookups
    function translateSubject(subject) {
        if (!subject) return '';
        return t('educational.subjects.' + subject, null, subject);
    }

    function translateGrade(grade) {
        if (!grade) return '';
        return t('educational.grades.' + grade, null, grade);
    }

    function translateGradeShort(grade) {
        if (!grade) return '';
        return t('educational.grades_short.' + grade, null, grade);
    }

    function translateRole(role) {
        if (!role) return '';
        return t('educational.roles.' + role, null, role);
    }

    function translateStatus(status) {
        if (!status) return '';
        return t('educational.statuses.' + status, null, status);
    }

    function translateDecision(decision) {
        if (!decision) return '';
        return t('educational.decisions.' + decision, null, decision);
    }

    function translateExceptionStatus(status) {
        if (!status) return '';
        return t('educational.exceptions.' + status, null, status);
    }

    // Comprehensive Bilingual Name Dictionary for all Seeded Users
    var nameDictionary = {
        // Administrators
        'System Administrator': 'مدير النظام',
        'Administrator': 'مدير النظام',
        'Admin': 'مدير النظام',

        // Teachers (Preparatory & Secondary)
        'Mr. Mohamed Reda': 'أ/ محمد رضا',
        'Mohamed Reda': 'محمد رضا',
        'Mr. Ahmed El-Sayed': 'أ/ أحمد السيد',
        'Ahmed El-Sayed': 'أحمد السيد',
        'Mr. Mahmoud Hassan': 'أ/ محمود حسن',
        'Mahmoud Hassan': 'محمود حسن',
        'Mr. Khaled Mansour': 'أ/ خالد منصور',
        'Khaled Mansour': 'خالد منصور',
        'Ms. Fatma El-Zahraa': 'أ/ فاطمة الزهراء',
        'Fatma El-Zahraa': 'فاطمة الزهراء',
        'Mr. Tarek Shawky': 'أ/ طارق شوقي',
        'Tarek Shawky': 'طارق شوقي',
        'Ms. Mona Abdelaziz': 'أ/ منى عبد العزيز',
        'Mona Abdelaziz': 'منى عبد العزيز',
        'Mr. Yasser Galal': 'أ/ ياسر جلال',
        'Yasser Galal': 'ياسر جلال',
        'Mr. Hisham Barakat': 'أ/ هشام بركات',
        'Hisham Barakat': 'هشام بركات',
        'Ms. Rania Youssef': 'أ/ رانيا يوسف',
        'Rania Youssef': 'رانيا يوسف',
        'Mr. Amr Diab': 'أ/ عمرو دياب',
        'Amr Diab': 'عمرو دياب',
        'Mr. Mostafa Mahmoud': 'أ/ مصطفى محمود',
        'Mostafa Mahmoud': 'مصطفى محمود',
        'Ms. Salma Hayek': 'أ/ سلمى حايك',
        'Salma Hayek': 'سلمى حايك',
        'Mr. Sherif Mounir': 'أ/ شريف منير',
        'Sherif Mounir': 'شريف منير',
        'Mr. Gamal Hamdan': 'أ/ جمال حمدان',
        'Gamal Hamdan': 'جمال حمدان',
        'Ms. Hoda Shaarawy': 'أ/ هدى شعراوي',
        'Hoda Shaarawy': 'هدى شعراوي',
        'Mr. Ezzat El-Alaili': 'أ/ عزت العلايلي',
        'Ezzat El-Alaili': 'عزت العلايلي',
        'Mr. Zaki Naguib': 'أ/ زكي نجيب',
        'Zaki Naguib': 'زكي نجيب',
        'Mr. Peter George': 'أ/ بيتر جورج',
        'Peter George': 'بيتر جورج',
        'Mr. Younan Labib': 'أ/ يونان لبيب',
        'Younan Labib': 'يونان لبيب',
        'Mr. Magdy Yacoub': 'أ/ مجدي يعقوب',
        'Magdy Yacoub': 'مجدي يعقوب',
        'Mr. Ahmed Zewail': 'أ/ أحمد زويل',
        'Ahmed Zewail': 'أحمد زويل',
        'Mr. Mourad Wahba': 'أ/ مراد وهبة',
        'Mourad Wahba': 'مراد وهبة',

        // Assistants
        'Asst. Karim Adel': 'م. كريم عادل',
        'Karim Adel': 'كريم عادل',
        'Asst. Tamer Hosny': 'م. تامر حسني',
        'Tamer Hosny': 'تامر حسني',
        'Asst. Hany Ramzy': 'م. هاني رمزي',
        'Hany Ramzy': 'هاني رمزي',
        'Asst. Salma Rashad': 'م. سلمى رشاد',
        'Salma Rashad': 'سلمى رشاد',
        'Asst. Noha Ezzat': 'م. نهى عزت',
        'Noha Ezzat': 'نهى عزت',
        'Asst. Mahmoud Said': 'م. محمود سعيد',
        'Mahmoud Said': 'محمود سعيد',
        'Asst. Hend Rostom': 'م. هند رستم',
        'Hend Rostom': 'هند رستم',
        'Asst. Amr Waked': 'م. عمرو واكد',
        'Amr Waked': 'عمرو واكد',
        'Asst. Rania Farid': 'م. رانيا فريد',
        'Rania Farid': 'رانيا فريد',
        'Asst. Khaled Saleh': 'م. خالد صالح',
        'Khaled Saleh': 'خالد صالح',
        'Asst. Nourhan Sherif': 'م. نورهان شريف',
        'Nourhan Sherif': 'نورهان شريف',
        'Asst. Yasmin Abdelaziz': 'م. ياسمين عبد العزيز',
        'Yasmin Abdelaziz': 'ياسمين عبد العزيز',
        'Asst. Mohamed Mamdouh': 'م. محمد ممدوح',
        'Mohamed Mamdouh': 'محمد ممدوح',
        'Asst. Menna Shalaby': 'م. منة شلبي',
        'Menna Shalaby': 'منة شلبي',
        'Asst. Ahmed Dawood': 'م. أحمد داوود',
        'Ahmed Dawood': 'أحمد داوود',
        'Asst. Nelly Karim': 'م. نيللي كريم',
        'Nelly Karim': 'نيللي كريم',
        'Asst. Omar Farouk': 'م. عمر فاروق',
        'Omar Farouk': 'عمر فاروق',
        'Asst. Asser Yassin': 'م. آسر ياسين',
        'Asser Yassin': 'آسر ياسين',
        'Asst. Mona Zaki': 'م. منى زكي',
        'Mona Zaki': 'منى زكي',
        'Asst. Ahmed Helmy': 'م. أحمد حلمي',
        'Ahmed Helmy': 'أحمد حلمي',
        'Asst. Karim Abdelaziz': 'م. كريم عبد العزيز',
        'Karim Abdelaziz': 'كريم عبد العزيز',
        'Asst. Mai Ezz Eldin': 'م. مي عز الدين',
        'Mai Ezz Eldin': 'مي عز الدين',
        'Asst. Mariam Samir': 'م. مريم سمير',
        'Mariam Samir': 'مريم سمير',
        'Asst. Amir Karara': 'م. أمير كرارة',
        'Amir Karara': 'أمير كرارة',
        'Asst. Tara Emad': 'م. تارا عماد',
        'Tara Emad': 'تارا عماد',
        'Asst. Ahmed Malek': 'م. أحمد مالك',
        'Ahmed Malek': 'أحمد مالك',
        'Asst. Huda El Mufti': 'م. هدى المفتي',
        'Huda El Mufti': 'هدى المفتي',
        'Asst. Nour El Nabawy': 'م. نور النبوي',
        'Nour El Nabawy': 'نور النبوي',
        'Asst. Bassem Youssef': 'م. باسم يوسف',
        'Bassem Youssef': 'باسم يوسف',
        'Asst. Salma Abu Deif': 'م. سلمى أبو ضيف',
        'Salma Abu Deif': 'سلمى أبو ضيف',
        'Asst. Mayan El Sayed': 'م. مايان السيد',
        'Mayan El Sayed': 'مايان السيد',
        'Asst. Essam Omar': 'م. عصام عمر',
        'Essam Omar': 'عصام عمر',
        'Asst. Taha Dessouky': 'م. طه دسوقي',
        'Taha Dessouky': 'طه دسوقي',
        'Asst. Asmaa Galal': 'م. أسماء جلال',
        'Asmaa Galal': 'أسماء جلال',
        'Asst. Dina Anwar': 'م. دينا أنور',
        'Dina Anwar': 'دينا أنور',
        'Asst. Aya Samaha': 'م. آية سماحة',
        'Aya Samaha': 'آية سماحة',
        'Asst. Ahmed Dash': 'م. أحمد داش',
        'Ahmed Dash': 'أحمد داش',
        'Asst. Sarrah Abdelrahman': 'م. سارة عبد الرحمن',
        'Sarrah Abdelrahman': 'سارة عبد الرحمن',
        'Asst. Mohamed Farrag': 'م. محمد فراج',
        'Mohamed Farrag': 'محمد فراج',
        'Asst. Passant Shawky': 'م. بسنت شوقي',
        'Passant Shawky': 'بسنت شوقي',
        'Asst. Amir El Masry': 'م. أمير المصري',
        'Amir El Masry': 'أمير المصري',
        'Asst. Cynthia Khalifeh': 'م. سينتيا خليفة',
        'Cynthia Khalifeh': 'سينتيا خليفة',
        'Asst. Ali Kassem': 'م. علي قاسم',
        'Ali Kassem': 'علي قاسم',
        'Asst. Malak Koura': 'م. ملك قورة',
        'Malak Koura': 'ملك قورة',
        'Asst. Adam Elsharkawy': 'م. أدم الشرقاوي',
        'Adam Elsharkawy': 'أدم الشرقاوي',
        'Asst. Jamila Awad': 'م. جميلة عوض',
        'Jamila Awad': 'جميلة عوض',

        // Students
        'Youssef Mohamed': 'يوسف محمد',
        'Nour El-Din': 'نور الدين',
        'Layla Hassan': 'ليلى حسن',
        'Tariq Ali': 'طارق علي',
        'Heba Sayed': 'هبة سيد',
        'Ziad Tarek': 'زياد طارق',
        'Habiba Amr': 'حبيبة عمرو',
        'Mariam Adel': 'مريم عادل',
        'Ahmed Khalil': 'أحمد خليل',
        'Malak Sherif': 'ملك شريف',
        'Omar Hany': 'عمر هاني',
        'Farida Mostafa': 'فريدة مصطفى',
        'Karim Hassan': 'كريم حسن',
        'Kareem Mostafa': 'كريم مصطفى',
        'Salma Ehab': 'سلمى إيهاب',
        'Hassan Kamal': 'حسن كمال',
        'Student': 'طالب',
        'Teacher': 'معلم',

        // Common First & Last Names (Arabic transliterated & International)
        'Mohamed': 'محمد', 'Mohammed': 'محمد', 'Muhammad': 'محمد', 'Mohamad': 'محمد',
        'Ahmed': 'أحمد', 'Mahmoud': 'محمود', 'Mostafa': 'مصطفى', 'Mustafa': 'مصطفى',
        'Ali': 'علي', 'Omar': 'عمر', 'Amr': 'عمرو', 'Youssef': 'يوسف', 'Yousef': 'يوسف',
        'Khaled': 'خالد', 'Khalid': 'خالد', 'Tarek': 'طارق', 'Tariq': 'طارق',
        'Sherif': 'شريف', 'Karim': 'كريم', 'Kareem': 'كريم', 'Hassan': 'حسن',
        'Hussein': 'حسين', 'Hussain': 'حسين', 'Ibrahim': 'إبراهيم', 'Ismail': 'إسماعيل',
        'Mina': 'مينا', 'Bishoy': 'بيشوي', 'Kirollos': 'كيرلس', 'Abanoub': 'أبانوب',
        'Fady': 'فادي', 'Hany': 'هاني', 'Wael': 'وائل', 'Samer': 'سامر', 'Nabil': 'نبيل',
        'Magdy': 'مجدي', 'Ashraf': 'أشرف', 'Medhat': 'مدحت', 'Ayman': 'أيمن', 'Alaa': 'علاء',
        'Essam': 'عصام', 'Emad': 'عماد', 'Adel': 'عادل', 'Sameh': 'سامح', 'Walid': 'وليد',
        'Bassem': 'باسم', 'Ramy': 'رامي', 'Rami': 'رامي', 'Shady': 'شادي', 'Ziad': 'زياد',
        'Hazem': 'حازم', 'Ehab': 'إيهاب', 'Hossam': 'حسام', 'Hesham': 'هشام', 'Hamdy': 'حمدي',
        'Shawky': 'شوقي', 'Reda': 'رضا', 'Diab': 'دياب', 'Galal': 'جلال', 'Mansour': 'منصور',
        'Mounir': 'منير', 'Khalil': 'خليل', 'Kamal': 'كمال', 'Sayed': 'سيد', 'Salem': 'سالم',
        'Soliman': 'سليمان', 'Bakr': 'بكر', 'Othman': 'عثمان', 'Farouk': 'فاروق', 'Nasser': 'ناصر',
        'Naguib': 'نجيب', 'Zaki': 'زكي', 'Ezzat': 'عزت', 'Fouad': 'فؤاد', 'Wahba': 'وهبة',
        'Girgis': 'جرجس', 'Shenouda': 'شنودة', 'Fatma': 'فاطمة', 'Fatima': 'فاطمة',
        'Mona': 'منى', 'Salma': 'سلمى', 'Rania': 'رانيا', 'Layla': 'ليلى', 'Laila': 'ليلى',
        'Nour': 'نور', 'Noor': 'نور', 'Heba': 'هبة', 'Dina': 'دينا', 'Hoda': 'هدى',
        'Farida': 'فريدة', 'Mariam': 'مريم', 'Maryam': 'مريم', 'Habiba': 'حبيبة',
        'Malak': 'ملك', 'Aya': 'آية', 'Yasmin': 'ياسمين', 'Yasmine': 'ياسمين',
        'Noha': 'نهى', 'Nada': 'ندى', 'Reem': 'ريم', 'Sara': 'سارة', 'Sarah': 'سارة',
        'Mai': 'مي', 'May': 'مي', 'Doaa': 'دعاء', 'Marwa': 'مروة', 'Shaimaa': 'شيماء',
        'Radwa': 'رضوى', 'Asmaa': 'أسماء', 'Basma': 'بسمة', 'Dalia': 'داليا', 'Riham': 'ريهام',
        'Omnia': 'أمنية', 'Hend': 'هند', 'Samar': 'سمر', 'Eman': 'إيمان', 'Nehal': 'نهال',
        'Donia': 'دنيا', 'Menna': 'منة', 'Shahd': 'شهد', 'Jana': 'جنى', 'Karma': 'كارما',
        'John': 'جون', 'David': 'ديفيد', 'Mark': 'مارك', 'Michael': 'مايكل', 'Mary': 'ماري',
        'Peter': 'بيتر', 'Paul': 'بول', 'George': 'جورج', 'Daniel': 'دانيال', 'James': 'جيمس',
        'Robert': 'روبرت', 'William': 'ويليام', 'Thomas': 'توماس', 'Richard': 'ريتشارد',
        'Charles': 'تشارلز', 'Joseph': 'جوزيف', 'Edward': 'إدوارد', 'Brian': 'براين',
        'Kevin': 'كيفن', 'Steven': 'ستيفن', 'Alex': 'أليكس', 'Alexander': 'ألكسندر',
        'Andrew': 'أندرو', 'Anthony': 'أنطوني', 'Matthew': 'ماثيو', 'Christopher': 'كريستوفر',
        'Smith': 'سميث', 'Johnson': 'جونسون', 'Williams': 'ويليامز', 'Brown': 'براون',
        'Jones': 'جونز', 'Miller': 'ميلر', 'Davis': 'ديفيس', 'Wilson': 'ويلسون',
        'Taylor': 'تايلور', 'Anderson': 'أندرسون', 'Thomas': 'توماس', 'Jackson': 'جاكسون',
        'White': 'وايت', 'Harris': 'هاريس', 'Martin': 'مارتن', 'Thompson': 'طومسون',
        'Clark': 'كلارك', 'Lewis': 'لويس', 'Robinson': 'روبنسون', 'Walker': 'ووكر',
        'Hall': 'هول', 'Allen': 'ألين', 'Young': 'يونغ', 'King': 'كينغ', 'Wright': 'رايت',
        'Scott': 'سكوت', 'Green': 'غرين', 'Baker': 'بيكر', 'Adams': 'أدامز', 'Nelson': 'نيلسون',
        'Hill': 'هيل', 'Campbell': 'كامبل', 'Mitchell': 'ميتشل', 'Roberts': 'روبرتس',
        'Carter': 'كارتر', 'Phillips': 'فيليبس', 'Evans': 'إيفانز', 'Turner': 'تيرنر',
        'Parker': 'باركر', 'Collins': 'كولينز', 'Edwards': 'إدواردز', 'Stewart': 'ستيوارت',
        'Morris': 'موريس', 'Murphy': 'مورفي', 'Cook': 'كوك', 'Rogers': 'روجرز',
        'Morgan': 'مورغان', 'Peterson': 'بيترسون', 'Cooper': 'كوبر', 'Reed': 'ريد',
        'Bailey': 'بيلي', 'Bell': 'بيل', 'Kelly': 'كيلي', 'Howard': 'هاوارد', 'Ward': 'وارد',
        'Richardson': 'ريتشاردسون', 'Wood': 'وود', 'Watson': 'واتسون', 'Brooks': 'بروكس',
        'Bennett': 'بينيت', 'Gray': 'غراي', 'Price': 'برايس', 'Hughes': 'هيوز',
        'Sanders': 'ساندرز', 'Ross': 'روس', 'Powell': 'باول', 'Russell': 'راسل',
        'Perry': 'بيري', 'Butler': 'باتلر', 'Barnes': 'بارنز', 'Fisher': 'فيشر'
    };

    // Phonetic transliterator for arbitrary English words/names into Arabic
    function transliterateToPhoneticArabic(word) {
        if (!word) return '';
        if (/[\u0600-\u06FF]/.test(word)) return word; // already Arabic

        var w = word.toLowerCase();
        // Multi-letter sounds
        w = w.replace(/sh/g, 'ش')
             .replace(/ch/g, 'تش')
             .replace(/th/g, 'ث')
             .replace(/kh/g, 'خ')
             .replace(/gh/g, 'غ')
             .replace(/dh/g, 'ذ')
             .replace(/ph/g, 'ف')
             .replace(/ou/g, 'و')
             .replace(/oo/g, 'و')
             .replace(/ee/g, 'ي')
             .replace(/ea/g, 'ي')
             .replace(/ai/g, 'اي')
             .replace(/ay/g, 'اي')
             .replace(/ey/g, 'ي');

        var charMap = {
            'a': 'ا', 'b': 'ب', 'c': 'ك', 'd': 'د', 'e': 'ي', 'f': 'ف',
            'g': 'ج', 'h': 'ه', 'i': 'ي', 'j': 'ج', 'k': 'ك', 'l': 'ل',
            'm': 'م', 'n': 'ن', 'o': 'و', 'p': 'ب', 'q': 'ق', 'r': 'ر',
            's': 'س', 't': 'ت', 'u': 'و', 'v': 'ف', 'w': 'و', 'x': 'كس',
            'y': 'ي', 'z': 'ز'
        };

        var out = '';
        for (var i = 0; i < w.length; i++) {
            var ch = w[i];
            if (charMap[ch]) {
                var mapped = charMap[ch];
                // Avoid redundant consecutive long vowels like اا or يي
                if (out.length > 0 && out[out.length - 1] === mapped && (mapped === 'ا' || mapped === 'ي' || mapped === 'و')) {
                    continue;
                }
                out += mapped;
            } else {
                out += ch;
            }
        }
        return out;
    }

    function translateName(name) {
        if (!name || currentLang !== 'ar') return name;
        var trimmed = String(name).trim();
        if (!trimmed) return '';

        // If already contains Arabic characters, format digits and return
        if (/[\u0600-\u06FF]/.test(trimmed)) {
            return toArabicDigits(trimmed);
        }

        if (nameDictionary[trimmed]) return nameDictionary[trimmed];

        if (trimmed.indexOf(',') !== -1) {
            return trimmed.split(',').map(function (item) {
                return translateName(item.trim());
            }).join('، ');
        }

        // Handle title prefixes dynamically
        var prefix = '';
        var rest = trimmed;
        var prefixes = [
            { en: 'Mr. ', ar: 'أ/ ' },
            { en: 'Mr ', ar: 'أ/ ' },
            { en: 'Ms. ', ar: 'أ/ ' },
            { en: 'Ms ', ar: 'أ/ ' },
            { en: 'Mrs. ', ar: 'أ/ ' },
            { en: 'Mrs ', ar: 'أ/ ' },
            { en: 'Dr. ', ar: 'د/ ' },
            { en: 'Dr ', ar: 'د/ ' },
            { en: 'Eng. ', ar: 'م/ ' },
            { en: 'Eng ', ar: 'م/ ' },
            { en: 'Prof. ', ar: 'أ.د/ ' },
            { en: 'Asst. ', ar: 'م. ' },
            { en: 'Asst ', ar: 'م. ' },
            { en: 'Teacher ', ar: 'المعلم ' },
            { en: 'Student ', ar: 'الطالب ' },
            { en: 'Admin ', ar: 'المسؤول ' }
        ];

        for (var p = 0; p < prefixes.length; p++) {
            if (rest.indexOf(prefixes[p].en) === 0) {
                prefix = prefixes[p].ar;
                rest = rest.substring(prefixes[p].en.length).trim();
                break;
            }
        }

        if (nameDictionary[rest]) {
            return prefix + nameDictionary[rest];
        }

        // Translate / transliterate word by word
        var parts = rest.split(/\s+/);
        var translatedParts = parts.map(function (w) {
            var cleanWord = w.replace(/^[^\w]+|[^\w]+$/g, '');
            if (!cleanWord) return w;
            if (nameDictionary[cleanWord]) return nameDictionary[cleanWord];
            var cap = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
            if (nameDictionary[cap]) return nameDictionary[cap];
            return transliterateToPhoneticArabic(cleanWord);
        });

        return prefix + translatedParts.join(' ');
    }

    function translateCourse(courseName) {
        if (!courseName || currentLang !== 'ar') return courseName;
        var res = String(courseName);

        // If already Arabic, format digits and return
        if (/[\u0600-\u06FF]/.test(res)) {
            return toArabicDigits(res);
        }

        // Stages & Grade Levels
        res = res.replace(/\(1st Prep\)/gi, '(الصف الأول الإعدادي)')
                 .replace(/\(2nd Prep\)/gi, '(الصف الثاني الإعدادي)')
                 .replace(/\(3rd Prep\)/gi, '(الصف الثالث الإعدادي)')
                 .replace(/\(1st Sec\)/gi, '(الصف الأول الثانوي)')
                 .replace(/\(2nd Sec\)/gi, '(الصف الثاني الثانوي)')
                 .replace(/\(3rd Sec\)/gi, '(الصف الثالث الثانوي)')
                 .replace(/\(Preparatory\)/gi, '(المرحلة الإعدادية)')
                 .replace(/\(Secondary\)/gi, '(المرحلة الثانوية)')
                 .replace(/1st Prep/gi, 'الصف الأول الإعدادي')
                 .replace(/2nd Prep/gi, 'الصف الثاني الإعدادي')
                 .replace(/3rd Prep/gi, 'الصف الثالث الإعدادي')
                 .replace(/1st Sec/gi, 'الصف الأول الثانوي')
                 .replace(/2nd Sec/gi, 'الصف الثاني الثانوي')
                 .replace(/3rd Sec/gi, 'الصف الثالث الثانوي')
                 .replace(/Preparatory/gi, 'المرحلة الإعدادية')
                 .replace(/Secondary/gi, 'المرحلة الثانوية');

        // Comprehensive Subject Translations
        var courseDict = [
            { en: /Philosophy\s*(&|and)\s*Logic/gi, ar: 'الفلسفة والمنطق' },
            { en: /Integrated Sciences/gi, ar: 'العلوم المتكاملة' },
            { en: /First Foreign Language/gi, ar: 'اللغة الأجنبية الأولى' },
            { en: /Second Foreign Language/gi, ar: 'اللغة الأجنبية الثانية' },
            { en: /Social Studies/gi, ar: 'الدراسات الاجتماعية' },
            { en: /Computer Science/gi, ar: 'الحاسب الآلي' },
            { en: /Information Technology/gi, ar: 'تكنولوجيا المعلومات' },
            { en: /Physical Education/gi, ar: 'التربية الرياضية' },
            { en: /Religious Education/gi, ar: 'التربية الدينية' },
            { en: /Islamic Studies/gi, ar: 'التربية الدينية الإسلامية' },
            { en: /Christian Studies/gi, ar: 'التربية الدينية المسيحية' },
            { en: /Art Education|Art/gi, ar: 'التربية الفنية' },
            { en: /Music/gi, ar: 'التربية الموسيقية' },
            { en: /Trigonometry/gi, ar: 'حساب المثلثات' },
            { en: /Calculus/gi, ar: 'التفاضل والتكامل' },
            { en: /Algebra/gi, ar: 'الجبر' },
            { en: /Geometry/gi, ar: 'الهندسة' },
            { en: /Statistics/gi, ar: 'الإحصاء' },
            { en: /Mathematics|Math/gi, ar: 'الرياضيات' },
            { en: /Physics/gi, ar: 'الفيزياء' },
            { en: /Chemistry/gi, ar: 'الكيمياء' },
            { en: /Biology/gi, ar: 'الأحياء' },
            { en: /Geology/gi, ar: 'الجيولوجيا' },
            { en: /Science/gi, ar: 'العلوم' },
            { en: /History/gi, ar: 'التاريخ' },
            { en: /Geography/gi, ar: 'الجغرافيا' },
            { en: /Philosophy/gi, ar: 'الفلسفة' },
            { en: /Logic/gi, ar: 'المنطق' },
            { en: /Psychology/gi, ar: 'علم النفس' },
            { en: /Sociology/gi, ar: 'علم الاجتماع' },
            { en: /Arabic Language|Arabic/gi, ar: 'اللغة العربية' },
            { en: /English Language|English/gi, ar: 'اللغة الإنجليزية' },
            { en: /French Language|French/gi, ar: 'اللغة الفرنسية' },
            { en: /German Language|German/gi, ar: 'اللغة الألمانية' },
            { en: /Italian Language|Italian/gi, ar: 'اللغة الإيطالية' },
            { en: /Spanish Language|Spanish/gi, ar: 'اللغة الإسبانية' },
            { en: /Programming/gi, ar: 'البرمجة' },
            { en: /Course/gi, ar: 'مقرر' },
            { en: /Class/gi, ar: 'فصل' },
            { en: /Level\s*(\d+)/gi, ar: function(_, n) { return 'المستوى ' + toArabicDigits(n); } },
            { en: /Grade\s*(\d+)/gi, ar: function(_, n) { return 'الصف ' + toArabicDigits(n); } },
            { en: /Semester\s*(\d+)/gi, ar: function(_, n) { return 'الفصل الدراسي ' + toArabicDigits(n); } },
            { en: /Term\s*(\d+)/gi, ar: function(_, n) { return 'الترم ' + toArabicDigits(n); } },
            { en: /Advanced/gi, ar: 'متقدم' },
            { en: /Basic/gi, ar: 'أساسي' },
            { en: /Introduction to/gi, ar: 'مقدمة في' }
        ];

        for (var c = 0; c < courseDict.length; c++) {
            res = res.replace(courseDict[c].en, courseDict[c].ar);
        }

        return toArabicDigits(res);
    }

    function toArabicDigits(str) {
        if (str === null || str === undefined) return '';
        if (currentLang !== 'ar') return String(str);
        var s = String(str);
        var id = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
        return s.replace(/[0-9]/g, function (w) {
            return id[+w];
        });
    }

    function translateAssignment(title) {
        if (!title || currentLang !== 'ar') return title;
        var res = String(title);

        // If already Arabic, format digits and return
        if (/[\u0600-\u06FF]/.test(res)) {
            return toArabicDigits(res);
        }

        // First apply course/subject translation
        res = translateCourse(res);

        // Assignment vocabulary
        var assignDict = [
            { en: /Problem Set/gi, ar: 'مجموعة مسائل' },
            { en: /Final Project/gi, ar: 'مشروع نهائي' },
            { en: /Midterm Project/gi, ar: 'مشروع منتصف الفصل' },
            { en: /Midterm Exam|Midterm Test/gi, ar: 'امتحان منتصف الفصل' },
            { en: /Final Exam|Final Test/gi, ar: 'الامتحان النهائي' },
            { en: /Homework/gi, ar: 'واجب منزلي' },
            { en: /Assignment/gi, ar: 'واجب' },
            { en: /Quiz/gi, ar: 'اختبار قصير' },
            { en: /Exam|Test/gi, ar: 'امتحان' },
            { en: /Midterm/gi, ar: 'منتصف الفصل' },
            { en: /Final/gi, ar: 'نهائي' },
            { en: /Project/gi, ar: 'مشروع' },
            { en: /Exercises/gi, ar: 'تمارين' },
            { en: /Exercise/gi, ar: 'تمرين' },
            { en: /Worksheet/gi, ar: 'ورقة عمل' },
            { en: /Practice/gi, ar: 'تدريب' },
            { en: /Review/gi, ar: 'مراجعة' },
            { en: /Task/gi, ar: 'مهمة' },
            { en: /Questions/gi, ar: 'أسئلة' },
            { en: /Question/gi, ar: 'سؤال' },
            { en: /Chapter/gi, ar: 'الفصل' },
            { en: /Unit/gi, ar: 'الوحدة' },
            { en: /Lesson/gi, ar: 'الدرس' },
            { en: /Part/gi, ar: 'الجزء' },
            { en: /Section/gi, ar: 'القسم' },
            { en: /Reading/gi, ar: 'قراءة' },
            { en: /Writing/gi, ar: 'كتابة' },
            { en: /Grammar/gi, ar: 'قواعد' },
            { en: /Vocabulary/gi, ar: 'مفردات' },
            { en: /Literature/gi, ar: 'أدب' },
            { en: /Poetry/gi, ar: 'نصوص' },
            { en: /Mechanics/gi, ar: 'ميكانيكا' },
            { en: /Electricity/gi, ar: 'كهرباء' },
            { en: /\bfor\b/gi, ar: 'لـ' },
            { en: /\bon\b/gi, ar: 'في' },
            { en: /\bin\b/gi, ar: 'في' },
            { en: /\band\b/gi, ar: 'و' },
            { en: /\bof\b/gi, ar: 'من' }
        ];

        for (var a = 0; a < assignDict.length; a++) {
            res = res.replace(assignDict[a].en, assignDict[a].ar);
        }

        return toArabicDigits(res);
    }

    function translateDescription(desc) {
        if (!desc || currentLang !== 'ar') return desc;
        var res = String(desc);

        if (res === 'No description' || res === 'No description provided') return 'لا يوجد وصف';
        if (res === 'None' || res === 'None assigned') return 'لا يوجد';

        // If already Arabic, format digits and return
        if (/[\u0600-\u06FF]/.test(res)) {
            return toArabicDigits(res);
        }

        var compMatch = res.match(/Comprehensive (.*) curriculum for (.*)/i);
        if (compMatch) {
            var subjTr = translateCourse(compMatch[1]);
            var gradeTr = translateCourse('(' + compMatch[2] + ')').replace(/[()]/g, '');
            return 'منهج شامل لمادة ' + subjTr + ' لـ ' + gradeTr;
        }

        var hwMatch = res.match(/Weekly homework and practice problem set #(\d+) for (.*)\.?/i);
        if (hwMatch) {
            var num = toArabicDigits(hwMatch[1]);
            var subj = translateCourse(hwMatch[2].replace(/\.$/, ''));
            return 'واجب أسبوعي وتدريبات عملية رقم ' + num + ' لمادة ' + subj + '.';
        }

        var descDict = [
            { en: /Please solve questions/gi, ar: 'يرجى حل الأسئلة' },
            { en: /Please solve/gi, ar: 'يرجى حل' },
            { en: /Solve questions/gi, ar: 'حل الأسئلة' },
            { en: /Answer all questions/gi, ar: 'أجب عن جميع الأسئلة' },
            { en: /Upload PDF/gi, ar: 'ارفع ملف PDF' },
            { en: /Submit before deadline/gi, ar: 'سلم قبل الموعد النهائي' },
            { en: /Submit your work/gi, ar: 'سلم عملك' },
            { en: /From textbook/gi, ar: 'من الكتاب المدرسي' },
            { en: /from page\s*(\d+)\s*to page\s*(\d+)/gi, ar: function(_, p1, p2) { return 'من صفحة ' + toArabicDigits(p1) + ' إلى صفحة ' + toArabicDigits(p2); } },
            { en: /Page\s*(\d+)/gi, ar: function(_, p) { return 'صفحة ' + toArabicDigits(p); } },
            { en: /Read chapter\s*(\d+)/gi, ar: function(_, c) { return 'اقرأ الفصل ' + toArabicDigits(c); } },
            { en: /Chapter\s*(\d+)/gi, ar: function(_, c) { return 'الفصل ' + toArabicDigits(c); } },
            { en: /Unit\s*(\d+)/gi, ar: function(_, u) { return 'الوحدة ' + toArabicDigits(u); } },
            { en: /Lesson\s*(\d+)/gi, ar: function(_, l) { return 'الدرس ' + toArabicDigits(l); } },
            { en: /Questions\s*(\d+)\s*to\s*(\d+)/gi, ar: function(_, q1, q2) { return 'الأسئلة من ' + toArabicDigits(q1) + ' إلى ' + toArabicDigits(q2); } },
            { en: /(\d+)\s+to\s+(\d+)/gi, ar: function(_, a, b) { return toArabicDigits(a) + ' إلى ' + toArabicDigits(b); } },
            { en: /Questions/gi, ar: 'الأسئلة' },
            { en: /Exercise\s*(\d+)/gi, ar: function(_, e) { return 'تمرين ' + toArabicDigits(e); } },
            { en: /Excellent work!? Well presented answers\.?/gi, ar: 'عمل ممتاز! إجابات منظمة ومكتملة.' },
            { en: /Excellent work!?/gi, ar: 'عمل ممتاز!' },
            { en: /Well done!?/gi, ar: 'أحسنت!' },
            { en: /Good job!?/gi, ar: 'عمل رائع!' },
            { en: /Needs improvement/gi, ar: 'يحتاج إلى تحسين' }
        ];

        for (var d = 0; d < descDict.length; d++) {
            res = res.replace(descDict[d].en, descDict[d].ar);
        }

        return toArabicDigits(res);
    }

    // Translate DOM elements marked with data-i18n
    function applyTranslations(root) {
        var context = root || document;

        // Text content
        var elements = context.querySelectorAll('[data-i18n]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var key = el.getAttribute('data-i18n');
            if (key) {
                var translated = t(key);
                if (translated) {
                    el.textContent = translated;
                }
            }
        }

        // Placeholders
        var placeholders = context.querySelectorAll('[data-i18n-placeholder]');
        for (var j = 0; j < placeholders.length; j++) {
            var pEl = placeholders[j];
            var pKey = pEl.getAttribute('data-i18n-placeholder');
            if (pKey) {
                var pTrans = t(pKey);
                if (pTrans) {
                    pEl.setAttribute('placeholder', pTrans);
                }
            }
        }

        // Titles
        var titles = context.querySelectorAll('[data-i18n-title]');
        for (var k = 0; k < titles.length; k++) {
            var tEl = titles[k];
            var tKey = tEl.getAttribute('data-i18n-title');
            if (tKey) {
                var tTrans = t(tKey);
                if (tTrans) {
                    tEl.setAttribute('title', tTrans);
                }
            }
        }

        // Values (for input type="submit", etc.)
        var values = context.querySelectorAll('[data-i18n-value]');
        for (var m = 0; m < values.length; m++) {
            var vEl = values[m];
            var vKey = vEl.getAttribute('data-i18n-value');
            if (vKey) {
                var vTrans = t(vKey);
                if (vTrans) {
                    vEl.setAttribute('value', vTrans);
                }
            }
        }

        // Aria Labels
        var ariaEls = context.querySelectorAll('[data-i18n-aria-label]');
        for (var n = 0; n < ariaEls.length; n++) {
            var aEl = ariaEls[n];
            var aKey = aEl.getAttribute('data-i18n-aria-label');
            if (aKey) {
                var aTrans = t(aKey);
                if (aTrans) {
                    aEl.setAttribute('aria-label', aTrans);
                }
            }
        }

        // Dynamically translate document.title if it contains System / النظام / Assignment System
        if (document.title) {
            var isAr = (currentLang === 'ar');
            var appName = isAr ? 'النظام' : 'System';
            // Replace suffix if present
            if (/ - (Assignment System|System|نظام الواجبات المدرسية|نظام الواجبات|النظام)$/i.test(document.title)) {
                document.title = document.title.replace(/ - (Assignment System|System|نظام الواجبات المدرسية|نظام الواجبات|النظام)$/i, ' - ' + appName);
            } else if (/^(Assignment System|System|نظام الواجبات المدرسية|نظام الواجبات|النظام)$/i.test(document.title.trim())) {
                document.title = appName;
            }
        }

        // Update all Language Toggle buttons on page
        updateAllLanguageButtons();
    }

    // Update state and label of Language Toggle buttons
    function updateAllLanguageButtons() {
        var btns = document.querySelectorAll('.lang-toggle-btn, #lang-toggle-btn');
        var isAr = (currentLang === 'ar');
        var targetLabel = isAr ? 'الإنجليزية' : 'العربية';
        var ariaLabel = isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic';

        for (var i = 0; i < btns.length; i++) {
            var btn = btns[i];
            btn.classList.add('lang-toggle-btn');
            btn.innerHTML = GLOBE_ICON + ' <span>' + targetLabel + '</span>';
            btn.setAttribute('aria-label', ariaLabel);
            btn.setAttribute('title', ariaLabel);
        }
    }

    // Toggle current language between 'en' and 'ar'
    function toggleLanguage() {
        var nextLang = (currentLang === 'en') ? 'ar' : 'en';
        setLanguage(nextLang);
    }

    // Set specific language
    function setLanguage(lang) {
        if (lang !== 'en' && lang !== 'ar') return;
        currentLang = lang;
        persistLanguage(lang);
        applyDocumentDirection(lang);

        loadCatalogs(function () {
            applyTranslations();
            var event = new CustomEvent('languageChanged', { detail: { lang: lang } });
            window.dispatchEvent(event);
        });
    }

    // Create and attach language toggle button beside theme toggle button
    function ensureLanguageToggle() {
        var existing = document.querySelector('.lang-toggle-btn, #lang-toggle-btn');
        if (existing) {
            existing.classList.add('lang-toggle-btn');
            existing.removeEventListener('click', toggleLanguage);
            existing.addEventListener('click', toggleLanguage);
            updateAllLanguageButtons();
            return;
        }

        // In dashboard top bars: insert right before the theme toggle button (or logout button)
        var headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-toggle-btn';
            btn.addEventListener('click', toggleLanguage);

            var themeBtn = headerActions.querySelector('.theme-toggle-btn, #theme-toggle-btn');
            if (themeBtn) {
                headerActions.insertBefore(btn, themeBtn);
            } else {
                var logoutBtn = headerActions.querySelector('.logout-btn');
                if (logoutBtn) {
                    headerActions.insertBefore(btn, logoutBtn);
                } else {
                    headerActions.appendChild(btn);
                }
            }
            updateAllLanguageButtons();
            return;
        }

        // In auth pages: insert beside the theme toggle
        var authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            var authToggleWrap = authContainer.querySelector('.auth-theme-toggle');
            if (!authToggleWrap) {
                authToggleWrap = document.createElement('div');
                authToggleWrap.className = 'auth-theme-toggle';
                authContainer.appendChild(authToggleWrap);
            }
            var authBtn = document.createElement('button');
            authBtn.type = 'button';
            authBtn.className = 'lang-toggle-btn';
            authBtn.addEventListener('click', toggleLanguage);
            authToggleWrap.insertBefore(authBtn, authToggleWrap.firstChild);
            updateAllLanguageButtons();
        }
    }

    // Initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        applyDocumentDirection(currentLang);
        loadCatalogs(function () {
            applyTranslations();
            ensureLanguageToggle();
        });
    });

    // Public API exposed on window.i18n
    window.i18n = {
        getLanguage: function () { return currentLang; },
        getCurrentLanguage: function () { return currentLang; },
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage,
        t: t,
        translateName: translateName,
        translateCourse: translateCourse,
        translateAssignment: translateAssignment,
        translateDescription: translateDescription,
        translateSubject: translateSubject,
        translateGrade: translateGrade,
        translateGradeShort: translateGradeShort,
        translateRole: translateRole,
        translateStatus: translateStatus,
        translateDecision: translateDecision,
        translateExceptionStatus: translateExceptionStatus,
        toArabicDigits: toArabicDigits,
        applyTranslations: applyTranslations,
        ensureLanguageToggle: ensureLanguageToggle
    };

})(window, document);
