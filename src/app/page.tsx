import LeftPanel from "@/components/home/left-panel";
import RightPanel from "@/components/home/right-panel";
import { useTheme } from "next-themes";

export default function Home() {
	return (
		<div className="flex flex-col h-screen">
			<LeftPanel />
		</div>
	);
}
