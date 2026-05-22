import { useMemo, useEffect } from "react";
import { translations } from "../lib/translations";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/ja";

dayjs.extend(relativeTime);

function getValue(obj, path) {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function interpolate(text, params = {}) {
    if (typeof text !== "string") return text;

    return text.replace(/\{(\w+)\}/g, (_, key) => {
        return params[key] ?? `{${key}}`;
    });
}

export function useTranslation() {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    const language =
        storedUser?.appLanguage ||
        localStorage.getItem("appLanguage") ||
        "en";

    const dictionary = translations[language] || translations.en;


    useEffect(() => {
        const shortLang = language.split("-")[0]; // ej: en-US → en
        dayjs.locale(shortLang);
    }, [language]);

    const t = useMemo(() => {
        return (path, params = {}) => {
            const value =
                getValue(dictionary, path) ??
                getValue(translations.en, path) ??
                path;

            return interpolate(value, params);
        };
    }, [dictionary]);

    return {
        language,
        t,
    };
}