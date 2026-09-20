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
        'Teacher': 'معلم'
    };

    function translateName(name) {
        if (!name || currentLang !== 'ar') return name;
        var trimmed = String(name).trim();
        if (nameDictionary[trimmed]) return nameDictionary[trimmed];

        if (trimmed.indexOf(',') !== -1) {
            return trimmed.split(',').map(function (item) {
                return translateName(item.trim());
            }).join('، ');
        }

        if (trimmed.indexOf('Mr. ') === 0) {
            var subName = trimmed.substring(4);
            return 'أ/ ' + (nameDictionary[subName] || subName);
        }
        if (trimmed.indexOf('Ms. ') === 0) {
            var subName = trimmed.substring(4);
            return 'أ/ ' + (nameDictionary[subName] || subName);
        }
        if (trimmed.indexOf('Asst. ') === 0) {
            var subName = trimmed.substring(6);
            return 'م. ' + (nameDictionary[subName] || subName);
        }

        return trimmed;
    }

    function translateCourse(courseName) {
        if (!courseName || currentLang !== 'ar') return courseName;
        var res = String(courseName);

        res = res.replace(/\(1st Prep\)/g, '(الصف الأول الإعدادي)')
                 .replace(/\(2nd Prep\)/g, '(الصف الثاني الإعدادي)')
                 .replace(/\(3rd Prep\)/g, '(الصف الثالث الإعدادي)')
                 .replace(/\(1st Sec\)/g, '(الصف الأول الثانوي)')
                 .replace(/\(Preparatory\)/g, '(المرحلة الإعدادية)')
                 .replace(/\(Secondary\)/g, '(المرحلة الثانوية)');

        res = res.replace(/Philosophy & Logic/g, 'الفلسفة والمنطق')
                 .replace(/Integrated Sciences/g, 'العلوم المتكاملة')
                 .replace(/First Foreign Language/g, 'اللغة الأجنبية الأولى')
                 .replace(/Social Studies/g, 'الدراسات الاجتماعية')
                 .replace(/Mathematics/g, 'الرياضيات')
                 .replace(/Science/g, 'العلوم')
                 .replace(/History/g, 'التاريخ')
                 .replace(/English/g, 'اللغة الإنجليزية')
                 .replace(/Arabic/g, 'اللغة العربية');

        return res;
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

        res = res.replace(/Philosophy & Logic/g, 'الفلسفة والمنطق')
                 .replace(/Integrated Sciences/g, 'العلوم المتكاملة')
                 .replace(/First Foreign Language/g, 'اللغة الأجنبية الأولى')
                 .replace(/Social Studies/g, 'الدراسات الاجتماعية')
                 .replace(/Mathematics/g, 'الرياضيات')
                 .replace(/Science/g, 'العلوم')
                 .replace(/History/g, 'التاريخ')
                 .replace(/English/g, 'اللغة الإنجليزية')
                 .replace(/Arabic/g, 'اللغة العربية');

        res = res.replace(/Assignment\s*(\d+)/gi, function(_, num) {
            return 'واجب ' + toArabicDigits(num);
        }).replace(/Assignment/gi, 'واجب');

        return toArabicDigits(res);
    }

    function translateDescription(desc) {
        if (!desc || currentLang !== 'ar') return desc;
        var res = String(desc);

        if (res === 'No description' || res === 'No description provided') return 'لا يوجد وصف';
        if (res === 'None' || res === 'None assigned') return 'لا يوجد';
        if (res === 'Excellent work! Well presented answers.') return 'عمل ممتاز! إجابات منظمة ومكتملة.';
        if (res.indexOf('Please solve questions 1 to 5') !== -1) {
            return 'يرجى حل الأسئلة من ' + toArabicDigits('1') + ' إلى ' + toArabicDigits('5') + ' من الكتاب المدرسي ورفع الحل بصيغة PDF.';
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
