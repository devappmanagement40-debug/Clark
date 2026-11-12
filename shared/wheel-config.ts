import { z } from "zod";

const isAllowedWheelImage = (value: string) =>
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  || (value.startsWith("/") && !value.startsWith("//") && !value.includes(".."))
  || /^https:\/\/\S+$/i.test(value);

const wheelPrizeSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(1, "Le nom du lot est requis").max(60),
  kind: z.enum(["cash", "physical"]),
  amount: z.number().int().min(1).max(1_000_000_000).nullable(),
  currency: z.string().trim().regex(/^[A-Z]{3,6}$/),
  imageUrl: z.string().max(350_000).nullable().refine(
    (value) => value === null || isAllowedWheelImage(value),
    "Utilisez une image téléversée, une URL HTTPS ou un chemin local.",
  ),
  probability: z.number().min(0).max(100),
  active: z.boolean(),
}).superRefine((prize, context) => {
  if (prize.kind === "cash" && prize.amount === null) {
    context.addIssue({ code: "custom", path: ["amount"], message: "Le montant du lot est requis." });
  }
  if (prize.kind === "physical" && prize.amount !== null) {
    context.addIssue({ code: "custom", path: ["amount"], message: "Un lot matériel ne doit pas avoir de montant en espèces." });
  }
  if (prize.active && prize.probability <= 0) {
    context.addIssue({ code: "custom", path: ["probability"], message: "Un lot actif doit avoir une probabilité supérieure à 0 %." });
  }
  if (!prize.active && prize.probability !== 0) {
    context.addIssue({ code: "custom", path: ["probability"], message: "Un lot désactivé doit avoir une probabilité de 0 %." });
  }
});

export const wheelConfigurationSchema = z.object({
  buyerSpinsPerPurchase: z.number().int().min(0).max(100),
  referralSpinsPerPurchase: z.number().int().min(0).max(100),
  prizes: z.array(wheelPrizeSchema).min(1).max(20),
}).superRefine((configuration, context) => {
  const ids = new Set<string>();
  configuration.prizes.forEach((prize, index) => {
    if (ids.has(prize.id)) {
      context.addIssue({ code: "custom", path: ["prizes", index, "id"], message: "Chaque lot doit avoir un identifiant unique." });
    }
    ids.add(prize.id);
  });

  const activePrizes = configuration.prizes.filter((prize) => prize.active);
  const inlineImageCharacters = configuration.prizes.reduce(
    (total, prize) => total + (prize.imageUrl?.startsWith("data:image/") ? prize.imageUrl.length : 0),
    0,
  );
  if (inlineImageCharacters > 5_000_000) {
    context.addIssue({ code: "custom", path: ["prizes"], message: "Le poids total des images téléversées dépasse la limite autorisée." });
  }
  if (activePrizes.length === 0) {
    context.addIssue({ code: "custom", path: ["prizes"], message: "Activez au moins un lot." });
    return;
  }
  const totalProbability = activePrizes.reduce((sum, prize) => sum + prize.probability, 0);
  if (Math.abs(totalProbability - 100) > 0.01) {
    context.addIssue({
      code: "custom",
      path: ["prizes"],
      message: `Les probabilités des lots actifs doivent totaliser 100 % (actuellement ${totalProbability.toFixed(2)} %).`,
    });
  }
});

export type WheelPrizeConfiguration = z.infer<typeof wheelPrizeSchema>;
export type WheelConfiguration = z.infer<typeof wheelConfigurationSchema>;
export type PublicWheelConfiguration = {
  buyerSpinsPerPurchase: number;
  referralSpinsPerPurchase: number;
  prizes: WheelPrizeConfiguration[];
};

export const DEFAULT_WHEEL_CONFIGURATION: WheelConfiguration = {
  buyerSpinsPerPurchase: 1,
  referralSpinsPerPurchase: 1,
  prizes: [
    { id: "cash-777", title: "Gain en espèces", kind: "cash", amount: 777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "cash-2777", title: "Gain en espèces", kind: "cash", amount: 2777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "cash-7777", title: "Gain en espèces", kind: "cash", amount: 7777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "cash-27777", title: "Gain en espèces", kind: "cash", amount: 27777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "cash-17777", title: "Gain en espèces", kind: "cash", amount: 17777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "cash-37777", title: "Gain en espèces", kind: "cash", amount: 37777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "cash-97777", title: "Gain en espèces", kind: "cash", amount: 97777, currency: "XOF", imageUrl: null, probability: 10, active: true },
    { id: "headphones", title: "Casque audio", kind: "physical", amount: null, currency: "XOF", imageUrl: "/wheel-prizes/headphones.jpg", probability: 10, active: true },
    { id: "smartphone", title: "Téléphone", kind: "physical", amount: null, currency: "XOF", imageUrl: "/wheel-prizes/smartphone.jpg", probability: 10, active: true },
    { id: "motorcycle", title: "Moto", kind: "physical", amount: null, currency: "XOF", imageUrl: "/wheel-prizes/motorcycle.jpg", probability: 10, active: true },
  ],
};

export function parseWheelConfiguration(value: string | null | undefined): WheelConfiguration {
  if (!value) return DEFAULT_WHEEL_CONFIGURATION;
  return wheelConfigurationSchema.parse(JSON.parse(value));
}

export function displayWheelPrize(prize: WheelPrizeConfiguration): string {
  if (prize.kind === "cash" && prize.amount !== null) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(prize.amount)} ${prize.currency}`;
  }
  return prize.title;
}

export function getPublicWheelConfiguration(configuration: WheelConfiguration): PublicWheelConfiguration {
  return {
    buyerSpinsPerPurchase: configuration.buyerSpinsPerPurchase,
    referralSpinsPerPurchase: configuration.referralSpinsPerPurchase,
    prizes: configuration.prizes.filter((prize) => prize.active && prize.probability > 0),
  };
}
