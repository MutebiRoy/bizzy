import LeftPanel from "@/components/home/left-panel";
import RightPanel from "@/components/home/right-panel";
import { useTheme } from "next-themes";

export default function Home() {
	return (
		<main className=''>
			<div className='overflow-y-hidden h-screen mx-auto bg-left-panel'>
				<LeftPanel />
			</div>
		</main>
	);
}
