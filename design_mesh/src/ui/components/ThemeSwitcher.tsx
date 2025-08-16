"use client";
import * as React from "react";
import { ThemeIcon } from "./ThemeIcon";
import { useTheme } from "../context/ThemeContext";
import { Button } from "@swc-react/button";

const themes = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "acrylic", label: "Acrylic" },
];

export function ThemeSwitcher({ className = "" }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	const [isMounted, setIsMounted] = React.useState(false);
	React.useEffect(() => { setIsMounted(true); }, []);

	React.useEffect(() => {
		if (!isMounted) return;
		document.documentElement.classList.remove("light", "dark", "acrylic");
		if (theme === "light" || theme === "dark" || theme === "acrylic") {
			document.documentElement.classList.add(theme);
		}
		localStorage.setItem("adobe-addon-theme-mode", theme);
	}, [theme, isMounted]);

	return (
		<div className={`flex flex-col items-center gap-2 ${className}`}>
			{themes.map((t) => (
					<Button
						key={t.value}
						variant={theme === t.value ? "primary" : "secondary"}
						size="s"
						aria-label={t.label + " theme"}
						onClick={() => setTheme(t.value as any)}
						className={`transition-all duration-300 ease-out !w-10 !h-10 !min-w-10 !min-h-10 !max-w-10 !max-h-10 !p-2 ${
							theme === t.value
								? "ring-2 ring-primary scale-110 "
								: "hover:scale-105 hover:shadow-lg neon-glow"
						}`}
						style={{
							width: '40px',
							height: '40px',
							minWidth: '40px',
							minHeight: '40px',
							maxWidth: '40px',
							maxHeight: '40px',
							padding: '8px',
							margin: '3px',
						}}
					>
						<ThemeIcon theme={t.value as any} />
					</Button>
			))}
		</div>
	);
}
