import { screen } from "@testing-library/react";
import { renderPage } from "../../../test/renderPage";
import i18n from "../../i18n";
import { WelcomeSlider } from "./WelcomeSlider";
import type { HomeImage } from "@/apis/home_api";

const slides: HomeImage[] = [
  { id: "1", url: "/api/home/images/1", caption: "The showroom" },
  { id: "2", url: "/api/home/images/2", caption: null },
];

describe("Welcome slider", () => {
  it("stays out of the page while the gallery has published no photographs", () => {
    renderPage(<WelcomeSlider images={[]} />);

    expect(document.querySelector(".welcome-slider")).toBeNull();
  });

  it("slides through the published photographs", () => {
    renderPage(<WelcomeSlider images={slides} />);

    expect(screen.getByLabelText(i18n.t("welcomeImages"))).toBeInTheDocument();
    expect(screen.getByAltText("The showroom")).toHaveAttribute("src", "/api/home/images/1");
    expect(screen.getByAltText(i18n.t("welcomeImages"))).toHaveAttribute("src", "/api/home/images/2");
    expect(screen.getByText("The showroom")).toBeInTheDocument();
  });

  it("only offers controls when there is more than one photograph", () => {
    renderPage(<WelcomeSlider images={[slides[0]]} />);

    expect(document.querySelectorAll(".carousel-item")).toHaveLength(1);
    expect(screen.queryByLabelText("Next slide")).toBeNull();
  });
});
