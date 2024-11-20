import LeftPanel from "@/components/home/left-panel";
import RightPanel from "@/components/home/right-panel";
import { useTheme } from "next-themes";

export default function Home() {
	return (
		<main className='flex flex-col h-screen'>
			{/* <div className='overflow-y-hidden h-screen mx-auto bg-left-panel bo'> */}
				<LeftPanel />
			{/* </div> */}
		</main>
	);
}
