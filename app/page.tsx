import { BODY } from "./content";
import PortfolioScripts from "./PortfolioScripts";

export default function Home() {
  return (
    <>
      <div id="app" style={{ display: "contents" }} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: BODY }} />
      <PortfolioScripts />
    </>
  );
}
