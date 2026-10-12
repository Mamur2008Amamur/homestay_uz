import { describe, expect, it } from "vitest";
import { mergeStayCatalog, STAYS } from "../client/src/data/stays";

describe("uyjoy katalogi", () => {
  it("ikkala Bog'ishamol uyini alohida rasmlari bilan ko'rsatadi", () => {
    expect(STAYS).toHaveLength(2);
    expect(STAYS[0]).toMatchObject({
      city: "Samarqand",
      address: "Samarqand shahri, Bog'ishamol, Mosni oldida, 96-dom, 101-xona",
      pricePerNight: 420000,
      phone1: "+998 93 953 56 57",
      phone2: "+998 93 359 30 44",
      telegram: "@juliqian",
      images: [
        "/listings/bogishamol-exterior-1.png",
        "/listings/bogishamol-exterior-2.png",
        "/listings/bogishamol-exterior-3.png",
        "/listings/bogishamol-96-front.png",
        "/listings/bogishamol-96-living-room.png",
      ],
    });
    expect(STAYS[1]).toMatchObject({
      id: 1000001,
      titleUz: "Bog'ishamoldagi ikkinchi hovli uy",
      city: "Samarqand",
      pricePerNight: 420000,
      images: [
        "/listings/bogishamol-second-1.jpg",
        "/listings/bogishamol-second-2.jpg",
        "/listings/bogishamol-second-3.jpg",
      ],
    });
    expect(STAYS[1].images.some((image) => STAYS[0].images.includes(image))).toBe(false);
  });

  it("bazadagi eski e'lon o'rniga katalogdagi yangi suratlarni ishlatadi", () => {
    const [stay] = mergeStayCatalog([{ ...STAYS[0], titleUz: "Eski nom", images: ["/old.png"] }]);

    expect(mergeStayCatalog([STAYS[0]])).toHaveLength(2);
    expect(stay.titleUz).toBe("Bog'ishamoldagi zamonaviy hovli uy");
    expect(stay.images).toHaveLength(5);
    expect(stay.images[0]).toBe("/listings/bogishamol-exterior-1.png");
  });
});
