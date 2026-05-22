import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";


import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/ja";

dayjs.extend(relativeTime);

export const setDayjsLocale = (lang) => {
    if (!lang) return;

    const shortLang = lang.split("-")[0];

    dayjs.locale(shortLang);
};