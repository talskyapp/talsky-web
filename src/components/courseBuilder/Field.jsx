import React from "react";

export default function Field({ label, children }) {
    return (
        <div className="cb-field">
            <label className="cb-label">{label}</label>
            {children}
        </div>
    );
}