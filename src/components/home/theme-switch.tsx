"use client";
import {
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

const ThemeSwitch = () => {
	const { theme, setTheme } = useTheme();
  
	const toggleTheme = () => {
	  setTheme(theme === "dark" ? "light" : "dark");
	};
  
	return (
	  <DropdownMenuItem onClick={toggleTheme}>
		{theme === "dark" ? (
		  <SunIcon className="mr-2 h-4 w-4" />
		) : (
		  <MoonIcon className="mr-2 h-4 w-4" />
		)}
		<span>Switch Theme</span>
	  </DropdownMenuItem>
	);
  };
  
export default ThemeSwitch;
