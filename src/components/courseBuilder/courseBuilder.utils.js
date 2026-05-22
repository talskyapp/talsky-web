export function normalizeArrayResponse(data, possibleKeys = []) {
    if (Array.isArray(data)) return data;

    for (const key of possibleKeys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
}

export function buildLessonFormData(data) {
    const formData = new FormData();

    const clonedSteps = (data.steps || []).map((step, stepIndex) => {
        if (step.type !== "vocabulary") return step;

        return {
            ...step,
            items: (step.items || []).map((item, itemIndex) => {
                if (item.image instanceof File) {
                    formData.append(`vocab_image_${stepIndex}_${itemIndex}`, item.image);
                }

                if (item.audio instanceof File) {
                    formData.append(`vocab_audio_${stepIndex}_${itemIndex}`, item.audio);
                }

                return {
                    ...item,
                    image:
                        item.image instanceof File
                            ? ""
                            : typeof item.image === "string"
                                ? item.image
                                : "",
                    audio:
                        item.audio instanceof File
                            ? ""
                            : typeof item.audio === "string"
                                ? item.audio
                                : "",
                    imagePreview: "",
                    audioPreview: "",
                };
            }),
        };
    });

    const payload = {
        ...data,
        xpReward: Number(data.xpReward),
        estimatedMinutes: Number(data.estimatedMinutes),
        order: Number(data.order),
        steps: clonedSteps,
    };

    formData.append("lessonData", JSON.stringify(payload));
    return formData;
}