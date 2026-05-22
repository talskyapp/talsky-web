import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";

export default function XPBurst({ xp = 10 }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const controls = animate(0, xp, {
            duration: 1.2,
            onUpdate: (v) => setCount(Math.floor(v)),
        });

        return () => controls.stop();
    }, [xp]);

    return (
        <div className="xp-container">
            {/* partículas */}
            {[...Array(12)].map((_, i) => (
                <motion.span
                    key={i}
                    className="xp-particle"
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                        scale: 1,
                        x: Math.cos((i / 12) * 2 * Math.PI) * 60,
                        y: Math.sin((i / 12) * 2 * Math.PI) * 60,
                        opacity: 0,
                    }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                />
            ))}

            {/* número */}
            <motion.div
                className="xp-number"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                +{count} XP
            </motion.div>
        </div>
    );
}