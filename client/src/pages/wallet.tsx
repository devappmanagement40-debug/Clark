import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCountriesForDisplay, getWithdrawalMethodsForCountry, type ApiCountry } from "@/lib/countries";
import { CountrySelector } from "@/components/country-selector";
import { Loader2, Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, ChevronDown, Shield, Check, Search, X, Wifi } from "lucide-react";
import emptyIllustration from "@assets/illustration-8_1784762965573.png";
import { Link, useLocation, useSearch } from "wouter";
import type { WithdrawalWallet } from "@shared/schema";
import { getWalletBackPath } from "@/lib/navigation-targets";

const walletSchema = z.object({
  accountNumber: z.string().min(8, "Numéro requis"),
  paymentMethod: z.string().min(2, "Moyen de paiement requis"),
});

type WalletForm = z.infer<typeof walletSchema>;

function maskWalletNumber(accountNumber: string) {
  const compactNumber = accountNumber.replace(/\s+/g, "");
  if (compactNumber.length <= 6) return accountNumber;
  return `${compactNumber.slice(0, 2)}••••••${compactNumber.slice(-4)}`;
}

function getWalletOperatorIcon(paymentMethod: string) {
  const method = paymentMethod.toLowerCase();
  if (method.includes("orange")) return "/operators/orange.png";
  if (method.includes("mtn")) return "/operators/mtn.png";
  if (method.includes("moov")) return "/operators/moov.jpg";
  if (method.includes("airtel")) return "/operators/airtel.png";
  if (method.includes("wave")) return "/operators/wave.png";
  if (method.includes("tmoney") || method.includes("t-money")) return "/operators/tmoney.png";
  return "/favicon-square.jpg";
}

const walletStyles = `
  .wallet-page {
    width: 100%;
    min-height: 100dvh;
    overflow-x: hidden;
    background: #ffffff;
    color: #111827;
    font-family: Arial, sans-serif;
  }
  .wallet-page *,
  .wallet-page *::before,
  .wallet-page *::after {
    box-sizing: border-box;
  }
  .wallet-shell {
    width: 100%;
    max-width: 512px;
    min-height: 100dvh;
    margin: 0 auto;
    background: #ffffff;
  }
  .wallet-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 78px;
    padding: 17px 16px;
    border-bottom: 2px solid #111827;
    background: #ffffff;
  }
  .wallet-back,
  .wallet-top-action {
    display: grid;
    width: 42px;
    height: 42px;
    flex: none;
    place-items: center;
    border: 2px solid #111827;
    border-radius: 11px;
    background: #ffffff;
    box-shadow: 0 3px 0 #111827;
    color: #111827;
    cursor: pointer;
  }
  .wallet-top-action {
    background: #1947b8;
    border-color: #1947b8;
    box-shadow: 0 3px 0 #111827;
    color: #ffffff;
  }
  .wallet-heading {
    min-width: 0;
    flex: 1;
  }
  .wallet-eyebrow {
    display: block;
    margin-bottom: 2px;
    color: #12358f;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    line-height: 1.2;
    text-transform: uppercase;
  }
  .wallet-title {
    margin: 0;
    color: #171717;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.25;
  }
  .wallet-content {
    padding: 16px 16px 30px;
  }
  .wallet-hero {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid #d6e2ff;
    border-radius: 20px;
    background: #edf2ff;
  }
  .wallet-hero-icon {
    display: grid;
    width: 44px;
    height: 44px;
    flex: none;
    place-items: center;
    border-radius: 15px;
    background: #1947b8;
    color: #ffffff;
  }
  .wallet-hero h2 {
    margin: 0 0 4px;
    color: #171717;
    font-size: 15px;
    font-weight: 800;
  }
  .wallet-hero p {
    margin: 0;
    color: #6b625d;
    font-size: 13px;
    line-height: 1.5;
  }
  .wallet-section {
    margin-bottom: 16px;
    overflow: hidden;
    border: 2px solid #111827;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 0 #111827, 0 8px 16px rgba(17, 24, 39, .14);
  }
  .wallet-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 2px solid #111827;
  }
  .wallet-section-title {
    margin: 0;
    color: #111827;
    font-size: 16px;
    font-weight: 800;
  }
  .wallet-section-caption {
    margin: 3px 0 0;
    color: #4b5563;
    font-size: 12px;
    line-height: 1.35;
  }
  .wallet-step {
    display: grid;
    width: 30px;
    height: 30px;
    flex: none;
    place-items: center;
    border: 2px solid #111827;
    border-radius: 9px;
    background: #1947b8;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }
  .wallet-selector {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border: 0;
    background: #ffffff;
    color: #171717;
    text-align: left;
    cursor: pointer;
  }
  .wallet-selector:hover,
  .wallet-selector:focus-visible {
    background: #fffaf6;
    outline: none;
  }
  .wallet-selector-copy {
    min-width: 0;
    flex: 1;
  }
  .wallet-label {
    display: block;
    margin-bottom: 5px;
    color: #857b74;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .03em;
    text-transform: uppercase;
  }
  .wallet-value {
    display: block;
    overflow: hidden;
    color: #171717;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-value.is-empty {
    color: #a69c95;
    font-weight: 500;
  }
  .wallet-selector svg {
    flex: none;
    color: #12358f;
  }
  .wallet-field {
    padding: 15px 16px 16px;
  }
  .wallet-field + .wallet-field {
    border-top: 1px solid #f2ebe5;
  }
  .wallet-input {
    width: 100%;
    border: 0;
    border-bottom: 1px solid #d9cec5;
    padding: 3px 0 9px;
    outline: none;
    background: transparent;
    color: #171717;
    font-size: 15px;
  }
  .wallet-input:focus {
    border-color: #1947b8;
    box-shadow: 0 1px 0 #1947b8;
  }
  .wallet-input::placeholder {
    color: #b8aea7;
  }
  .wallet-error {
    margin: 6px 0 0;
    color: #12358f;
    font-size: 12px;
  }
  .wallet-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 14px 2px 0;
    color: #756b64;
    font-size: 12px;
    line-height: 1.45;
  }
  .wallet-note svg {
    flex: none;
    margin-top: 1px;
    color: #1947b8;
  }
  .wallet-list-section {
    margin-bottom: 0;
  }
  .wallet-list {
    display: grid;
    gap: 18px;
    padding: 16px;
  }
  .wallet-card-wrap {
    display: grid;
    gap: 8px;
  }
  .wallet-card {
    position: relative;
    display: flex;
    min-height: 210px;
    aspect-ratio: 1.586 / 1;
    align-items: stretch;
    gap: 10px;
    overflow: hidden;
    border: 2px solid #17191c;
    border-radius: 19px;
    padding: 18px;
    background:
      radial-gradient(ellipse at 100% 0%, rgba(255, 255, 255, .18), transparent 43%),
      linear-gradient(128deg, #081d58 0%, #12358f 42%, #1947b8 72%, #3174d1 100%);
    box-shadow: 0 4px 0 #17191c, 0 10px 20px rgba(17, 24, 39, .18);
    color: #ffffff;
    transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
  }
  .wallet-card::before {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(67deg, transparent 0 13%, rgba(255, 255, 255, .08) 13% 23%, transparent 23% 42%, rgba(255, 255, 255, .06) 42% 55%, transparent 55%),
      linear-gradient(130deg, rgba(255, 255, 255, .05), transparent 45%);
    content: "";
    pointer-events: none;
  }
  .wallet-card::after {
    position: absolute;
    right: -70px;
    bottom: -135px;
    width: 250px;
    aspect-ratio: 1;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: 50%;
    box-shadow: 0 0 0 18px rgba(255, 255, 255, .035), 0 0 0 38px rgba(255, 255, 255, .025);
    content: "";
    pointer-events: none;
  }
  .wallet-card > * {
    position: relative;
    z-index: 1;
  }
  .wallet-card.is-selectable {
    cursor: pointer;
  }
  .wallet-card.is-selectable:active {
    transform: scale(.99);
  }
  .wallet-card.is-default {
    box-shadow: 0 0 0 3px #ffffff, 0 4px 0 #17191c, 0 10px 20px rgba(17, 24, 39, .18);
  }
  .wallet-card-brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .wallet-card-brand-start {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }
  .wallet-card-icon {
    display: grid;
    width: 38px;
    height: 38px;
    flex: none;
    place-items: center;
    border: 2px solid rgba(255, 255, 255, .85);
    border-radius: 11px;
    background: #ffffff;
    padding: 4px;
    object-fit: contain;
  }
  .wallet-card-type {
    flex: none;
    border: 1px solid rgba(255, 255, 255, .58);
    border-radius: 999px;
    padding: 5px 9px;
    background: rgba(255, 255, 255, .12);
    color: #ffffff;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .12em;
  }
  .wallet-card-copy {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }
  .wallet-card-method {
    margin: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .wallet-card-number {
    margin: auto 0 20px;
    overflow: hidden;
    color: #ffffff;
    font-family: "Space Grotesk", "Arial", sans-serif;
    font-size: clamp(16px, 4.4vw, 21px);
    font-weight: 800;
    letter-spacing: .055em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-card-bottomline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .wallet-card-network {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 7px;
    color: rgba(255, 255, 255, .86);
    font-size: 11px;
    font-weight: 600;
  }
  .wallet-card-network span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-card-chip {
    position: relative;
    display: block;
    width: 48px;
    height: 35px;
    flex: none;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .65);
    border-radius: 8px;
    background:
      linear-gradient(90deg, transparent 31%, rgba(116, 72, 48, .3) 32% 34%, transparent 35% 65%, rgba(116, 72, 48, .3) 66% 68%, transparent 69%),
      linear-gradient(0deg, transparent 30%, rgba(116, 72, 48, .25) 31% 34%, transparent 35% 65%, rgba(116, 72, 48, .25) 66% 69%, transparent 70%),
      linear-gradient(135deg, #fff4df, #d9b984 58%, #f9e8c8);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .35), 0 2px 5px rgba(0, 0, 0, .16);
  }
  .wallet-card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
  }
  .wallet-icon-action {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    gap: 6px;
    border: 2px solid #111827;
    border-radius: 11px;
    padding: 0 12px;
    background: #ffffff;
    color: #111827;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
  .wallet-icon-action:hover,
  .wallet-icon-action:focus-visible {
    border-color: #111827;
    background: #edf2ff;
    outline: 3px solid rgb(25 71 184 / 22%);
    outline-offset: 2px;
  }
  .wallet-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 26px 16px 28px;
    text-align: center;
  }
  .wallet-empty img {
    width: 136px;
    height: 136px;
    object-fit: contain;
    opacity: .88;
  }
  .wallet-empty p {
    margin: 10px 0 0;
    color: #111827;
    font-size: 14px;
    font-weight: 700;
  }
  .wallet-empty p + p {
    margin-top: 4px;
    color: #4b5563;
    font-size: 12px;
    font-weight: 400;
  }
  .wallet-footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    padding: 12px 16px 20px;
    border-top: 2px solid #111827;
    background: rgba(255, 255, 255, .98);
    box-shadow: 0 -6px 18px rgba(17, 24, 39, .12);
  }
  .wallet-footer-inner {
    width: 100%;
    max-width: 508px;
    margin: 0 auto;
  }
  .wallet-primary {
    display: flex;
    width: 100%;
    min-height: 62px;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 2px solid #111827;
    border-radius: 11px;
    background: #1947b8;
    box-shadow: 0 4px 0 #111827, 0 7px 14px rgba(17, 24, 39, .18);
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
  }
  .wallet-primary:hover,
  .wallet-primary:focus-visible {
    background: #12358f;
    outline: 3px solid rgb(25 71 184 / 28%);
    outline-offset: 2px;
  }
  .wallet-primary:disabled {
    cursor: not-allowed;
    opacity: .55;
  }
  .wallet-form-page {
    background: #ffffff;
  }
  .wallet-form-topbar {
    border-bottom: 2px solid #111827;
    background: #ffffff;
  }
  .wallet-form-topbar .wallet-back {
    border-color: #111827;
    background: #ffffff;
    color: #111827;
  }
  .wallet-form-topbar .wallet-eyebrow {
    color: #171717;
  }
  .wallet-form-topbar .wallet-title {
    color: #171717;
  }
  .wallet-form-content {
    min-height: calc(100vh - 73px);
    display: grid;
    align-content: start;
    gap: 12px;
    padding: 18px 16px calc(112px + env(safe-area-inset-bottom));
    background: transparent;
  }
  .wallet-form-page .wallet-shell,
  .wallet-scene-page .wallet-shell {
    min-height: 100vh;
    background-color: #ffffff;
    background-image: none;
  }
  .wallet-scene-page .wallet-shell {
    background-position: center 190px;
  }
  .wallet-form-heading {
    display: flex;
    align-items: center;
    gap: 11px;
    margin: 0 2px 2px;
  }
  .wallet-form-step {
    display: grid;
    width: 38px;
    height: 38px;
    flex: none;
    place-items: center;
    border: 2px solid #17191c;
    border-radius: 12px;
    background: #1947b8;
    box-shadow: 0 2px 0 #17191c;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
  }
  .wallet-form-heading h2 {
    margin: 0;
    color: #111827;
    font-size: 17px;
    font-weight: 800;
    line-height: 1.25;
  }
  .wallet-reference-row,
  .wallet-reference-address {
    overflow: hidden;
    border: 2px solid #17191c;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 3px 0 #17191c, 0 7px 14px rgba(17, 24, 39, .14);
  }
  .wallet-reference-row {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: 12px;
    row-gap: 5px;
    min-height: 78px;
    padding: 13px 15px;
    background: #ffffff;
    color: #111827;
    text-align: left;
    cursor: pointer;
  }
  .wallet-reference-row:hover,
  .wallet-reference-row:focus-visible {
    border-color: #17191c;
    background: #f8faff;
    outline: 3px solid rgb(25 71 184 / 20%);
    outline-offset: 2px;
  }
  .wallet-reference-label {
    grid-column: 1;
    color: #6b7280;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .wallet-reference-value {
    grid-column: 1;
    min-width: 0;
    overflow: hidden;
    color: #111827;
    font-size: 15px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-reference-value.is-empty {
    color: #4b5563;
    font-weight: 500;
  }
  .wallet-reference-row svg {
    grid-column: 2;
    grid-row: 1 / span 2;
    flex: none;
    color: #1947b8;
  }
  .wallet-reference-address {
    min-height: 0;
    padding: 13px 15px 15px;
  }
  .wallet-form-address-heading {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
  }
  .wallet-form-address-step {
    display: grid;
    width: 25px;
    height: 25px;
    flex: none;
    place-items: center;
    border: 1.5px solid #17191c;
    border-radius: 8px;
    background: #edf2ff;
    color: #1947b8;
    font-size: 11px;
    font-weight: 800;
  }
  .wallet-reference-address label {
    display: block;
    margin: 0;
    color: #6b7280;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .wallet-reference-address .wallet-input {
    min-height: 48px;
    border: 1.5px solid #17191c;
    border-radius: 10px;
    padding: 0 12px;
    background: #ffffff;
    font-size: 15px;
    text-align: left;
  }
  .wallet-reference-address .wallet-input:focus {
    border-color: #1947b8;
    box-shadow: 0 0 0 3px rgb(25 71 184 / 16%);
  }
  .wallet-form-note {
    margin: 0;
    border: 1.5px solid #17191c;
    border-radius: 12px;
    padding: 11px 13px;
    background: #ffffff;
    box-shadow: 0 2px 0 #17191c, 0 5px 10px rgba(17, 24, 39, .1);
    color: #4b5563;
    font-size: 12px;
    line-height: 1.45;
    text-align: left;
  }
  @media (min-width: 700px) {
    .wallet-form-content {
      max-width: 480px;
      margin: 0 auto;
      padding-top: 24px;
    }
  }
  .wallet-form-page .wallet-footer {
    border-top: 0;
    background: transparent;
    box-shadow: none;
  }
  .wallet-scene-page .wallet-topbar {
    border-bottom: 2px solid #111827;
    background: #ffffff;
  }
  .wallet-scene-page .wallet-content {
    background: transparent;
  }
  .wallet-scene-add {
    position: relative;
    z-index: 1;
    padding: 28px 16px 22px;
    background: #ffffff;
  }
  .wallet-scene-add .wallet-primary {
    min-height: 62px;
    border-radius: 11px;
  }
  .wallet-scene-page .wallet-footer {
    border-top: 0;
    background: transparent;
    box-shadow: none;
  }
  .wallet-scene-page .wallet-primary {
    min-height: 62px;
    border-radius: 11px;
  }
  .wallet-scene-page:not(.is-select-mode) {
    background: #f0f0f0;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-shell {
    background-color: #f0f0f0;
    background-image: none;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-topbar {
    position: relative;
    min-height: 70px;
    border-bottom: 1px solid #dedbdd;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-eyebrow,
  .wallet-scene-page:not(.is-select-mode) .wallet-top-action {
    display: none;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-heading {
    position: absolute;
    left: 50%;
    width: max-content;
    max-width: calc(100% - 112px);
    transform: translateX(-50%);
    text-align: center;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-title {
    font-size: 18px;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-back {
    border: 0;
    box-shadow: none;
    color: #1947b8;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-content {
    padding: 12px 14px 16px;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-list-section {
    margin: 0;
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-section-header {
    display: none;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-list {
    gap: 13px;
    padding: 0;
  }
  .wallet-card.is-compact {
    min-height: 0;
    aspect-ratio: auto;
    align-items: center;
    overflow: hidden;
    border: 1.5px solid #17191c;
    border-radius: 15px;
    padding: 11px 12px;
    background: #fff;
    box-shadow: 0 3px 0 #17191c, 0 6px 14px rgba(17, 24, 39, .1);
    color: #17191c;
  }
  .wallet-card.is-compact::before,
  .wallet-card.is-compact::after {
    display: none;
  }
  .wallet-account-row {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }
  .wallet-account-icon {
    display: grid;
    width: 44px;
    height: 44px;
    flex: none;
    place-items: center;
    border: 1px solid #d6e2ff;
    border-radius: 12px;
    background: #edf2ff;
    color: #1947b8;
  }
  .wallet-account-copy {
    min-width: 0;
    flex: 1;
  }
  .wallet-account-method,
  .wallet-account-name,
  .wallet-account-number {
    display: block;
    overflow: hidden;
    margin: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wallet-account-method {
    color: #17191c;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.25;
  }
  .wallet-account-name,
  .wallet-account-number {
    margin-top: 4px;
    color: #5f5b5d;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
  }
  .wallet-account-number {
    font-variant-numeric: tabular-nums;
    letter-spacing: .025em;
  }
  .wallet-card.is-compact .wallet-card-actions {
    flex: none;
    gap: 5px;
  }
  .wallet-card.is-compact .wallet-icon-action {
    display: grid;
    width: 35px;
    min-width: 35px;
    min-height: 35px;
    place-items: center;
    border: 1px solid #dedbdd;
    border-radius: 10px;
    padding: 0;
    background: #fff;
    box-shadow: none;
    color: #6d6870;
  }
  .wallet-card.is-compact .wallet-icon-action:hover,
  .wallet-card.is-compact .wallet-icon-action:focus-visible {
    border-color: #1947b8;
    background: #edf2ff;
    color: #1947b8;
  }
  .wallet-card.is-compact .wallet-default-indicator {
    display: grid;
    width: 35px;
    height: 35px;
    flex: none;
    place-items: center;
    border: 1px solid #d6e2ff;
    border-radius: 10px;
    background: #edf2ff;
    color: #1947b8;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-scene-add {
    display: flex;
    justify-content: center;
    padding: 2px 16px calc(94px + env(safe-area-inset-bottom));
    background: #f0f0f0;
  }
  .wallet-scene-page:not(.is-select-mode) .wallet-scene-add .wallet-primary {
    width: min(100%, 260px);
    min-height: 52px;
    border-color: #1947b8;
    border-radius: 12px;
    background: #1947b8;
    box-shadow: 0 3px 0 #17191c, 0 6px 12px rgba(17, 24, 39, .12);
    font-size: 16px;
  }
  @media (min-width: 700px) {
    .wallet-footer {
      position: static;
      padding: 0 16px 24px;
      border-top: 0;
      background: #ffffff;
      box-shadow: none;
    }
  }
`;

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const selectMode = params.get("from") === "withdrawal";
  const [showForm, setShowForm] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [bankSearch, setBankSearch] = useState("");

  const { data: wallets, isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
  });

  const { data: loadedCountries, isError: countriesError } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
  });
  const apiCountries = getCountriesForDisplay(loadedCountries, countriesError);

  const form = useForm<WalletForm>({
    resolver: zodResolver(walletSchema),
    defaultValues: { accountNumber: "", paymentMethod: "" },
  });

  useEffect(() => {
    if (user && !selectedCountry) {
      setSelectedCountry(user.country);
    }
  }, [user, selectedCountry]);

  const addMutation = useMutation({
    mutationFn: async (data: WalletForm) => {
      const response = await apiRequest("POST", "/api/wallets", {
        ...data,
        accountName: user!.fullName,
        country: selectedCountry,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Le portefeuille n'a pas pu être ajouté.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: "Portefeuille ajouté !" });
      form.reset();
      setSelectedMethod("");
      setSelectedCountry(user?.country || "");
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Ajout du portefeuille impossible", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Le portefeuille n'a pas pu être supprimé.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: "Portefeuille supprimé !" });
    },
    onError: (error: any) => {
      toast({ title: "Suppression du portefeuille impossible", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Le portefeuille par défaut n'a pas pu être défini.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({ title: "Sélection du portefeuille impossible", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectWallet = (wallet: WithdrawalWallet) => {
    if (selectMode) {
      localStorage.setItem("selectedWalletId", wallet.id.toString());
      navigate("/withdrawal?from=wallet");
    }
  };

  const handleChooseMethod = (method: string) => {
    setSelectedMethod(method);
    form.setValue("paymentMethod", method);
    setBankSearch("");
    setShowBankSheet(false);
  };

  const handleChooseCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedMethod("");
    form.setValue("paymentMethod", "");
    setShowCountrySheet(false);
  };

  const handleSubmit = () => {
    if (!selectedCountry) {
      toast({ title: "Pays requis", description: "Sélectionnez un pays.", variant: "destructive" });
      return;
    }
    form.handleSubmit((data) => addMutation.mutate(data))();
  };

  if (!user) return null;

  const selectedCountryData = apiCountries.find(
    (country) => country.code === selectedCountry && country.isActive,
  );
  const selectedCountryLabel = selectedCountryData?.name || selectedCountry || "Sélectionner un pays";
  const paymentMethods = getWithdrawalMethodsForCountry(selectedCountry, apiCountries);
  const activeCountries = apiCountries
    .filter((country) => country.isActive)
    .sort((first, second) => first.name.localeCompare(second.name, "fr"));
  const backLink = getWalletBackPath(searchString);
  const showWalletOverview = selectMode || wallets === undefined || wallets.length > 0;

  if (showForm) {
    return (
      <div className="wallet-page wallet-form-page">
        <style>{walletStyles}</style>
        <div className="wallet-shell">
          <header className="wallet-topbar wallet-form-topbar">
            <button
              onClick={() => { setShowForm(false); form.reset(); setSelectedMethod(""); setSelectedCountry(user.country); }}
              className="wallet-back"
              data-testid="button-back-form"
              aria-label="Retour"
            >
              <ChevronLeft size={21} />
            </button>
            <div className="wallet-heading">
              <span className="wallet-eyebrow">Compte de retrait</span>
              <h1 className="wallet-title">Ajouter un compte</h1>
            </div>
            <div className="w-10" aria-hidden="true" />
          </header>

          <main className="wallet-content wallet-form-content">
            <div className="wallet-form-heading">
              <span className="wallet-form-step" aria-hidden="true">01</span>
              <div>
                <h2>Informations du compte</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCountrySheet(true)}
              className="wallet-reference-row"
              data-testid="button-select-country"
              aria-haspopup="dialog"
              aria-expanded={showCountrySheet}
            >
              <span className="wallet-reference-label">Pays</span>
              <span className={`wallet-reference-value${selectedCountry ? "" : " is-empty"}`}>
                {selectedCountryLabel}
              </span>
              <ChevronDown size={19} />
            </button>

            <button
              type="button"
              onClick={() => setShowBankSheet(true)}
              className="wallet-reference-row"
              data-testid="button-select-network"
            >
              <span className="wallet-reference-label">Network</span>
              <span className={`wallet-reference-value${selectedMethod ? "" : " is-empty"}`}>
                {selectedMethod || "Sélectionner un opérateur"}
              </span>
              <ChevronDown size={19} />
            </button>

            <div className="wallet-reference-address">
              <div className="wallet-form-address-heading">
                <span className="wallet-form-address-step" aria-hidden="true">02</span>
                <label htmlFor="wallet-account-number">Adresse</label>
              </div>
              <input
                id="wallet-account-number"
                {...form.register("accountNumber")}
                type="tel"
                placeholder="Saisissez le numéro"
                className="wallet-input"
                data-testid="input-wallet-number"
              />
              {form.formState.errors.accountNumber && (
                <p className="wallet-error">{form.formState.errors.accountNumber.message}</p>
              )}
            </div>

            <p className="wallet-form-note">
              Le numéro sera utilisé pour recevoir vos retraits.
            </p>
          </main>

        <footer className="wallet-footer">
          <div className="wallet-footer-inner">
            <button
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              className="wallet-primary"
              data-testid="button-confirm-wallet"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Confirmer"
              )}
            </button>
          </div>
        </footer>

        <CountrySelector
          open={showCountrySheet}
          onClose={() => setShowCountrySheet(false)}
          onSelect={handleChooseCountry}
          selectedCountryCode={selectedCountry}
          allowedCountryCodes={activeCountries.map((country) => country.code)}
        />

        {showBankSheet && (
          <div className="country-picker-overlay" onClick={() => { setBankSearch(""); setShowBankSheet(false); }}>
            <section
              className="country-picker"
              role="dialog"
              aria-modal="true"
              aria-label="Choisir un opérateur de paiement"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="country-picker-header">
                <h2>Choisir un opérateur</h2>
                <button
                  className="country-picker-close"
                  onClick={() => { setBankSearch(""); setShowBankSheet(false); }}
                  aria-label="Fermer"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="country-picker-search">
                <Search aria-hidden="true" />
                <input
                  autoFocus
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Rechercher"
                  aria-label="Rechercher un opérateur"
                />
              </div>
              <div className="country-picker-list">
                {paymentMethods
                  .filter((method) => method.toLowerCase().includes(bankSearch.trim().toLowerCase()))
                  .map((method) => (
                  <button
                    key={method}
                    onClick={() => handleChooseMethod(method)}
                    className={`country-picker-row${selectedMethod === method ? " is-selected" : ""}`}
                    data-testid={`button-bank-${method}`}
                  >
                    <span>{method}</span>
                    {selectedMethod === method && (
                      <span className="country-picker-check"><Check aria-hidden="true" /></span>
                    )}
                  </button>
                ))}
                {paymentMethods.filter((method) => method.toLowerCase().includes(bankSearch.trim().toLowerCase())).length === 0 && (
                  <p className="country-picker-empty">Aucun opérateur trouvé</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
      </div>
    );
  }

  return (
    <div className={`wallet-page wallet-scene-page${selectMode ? " is-select-mode" : ""}`}>
      <style>{walletStyles}</style>
      <div className="wallet-shell">
        <header className="wallet-topbar">
          <Link href={backLink}>
            <button className="wallet-back" data-testid="button-back" aria-label="Retour">
              <ChevronLeft size={19} />
            </button>
          </Link>
          <div className="wallet-heading">
              <span className="wallet-eyebrow">{selectMode ? "Retrait" : "Sécurité du compte"}</span>
            <h1 className="wallet-title">
                {selectMode ? "Sélectionner un compte" : "Liste des comptes bancaires"}
            </h1>
          </div>
          {!selectMode ? (
            <button
              onClick={() => setShowForm(true)}
              className="wallet-top-action"
              data-testid="button-add-wallet-icon"
              aria-label="Ajouter une carte"
            >
              <Plus size={19} />
            </button>
          ) : (
            <div className="w-10" aria-hidden="true" />
          )}
        </header>

        <main className="wallet-content">
          {showWalletOverview && (
            <>
              <section className="wallet-section wallet-list-section">
                <div className="wallet-section-header">
                  <div>
                    <h2 className="wallet-section-title">Comptes enregistrés</h2>
                    <p className="wallet-section-caption">
                      {wallets?.length ? `${wallets.length} compte${wallets.length > 1 ? "s" : ""} disponible${wallets.length > 1 ? "s" : ""}` : "Aucun compte ajouté"}
                    </p>
                  </div>
                  <span className="wallet-step"><CreditCard size={13} /></span>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1947b8]" />
                  </div>
                ) : wallets && wallets.length > 0 ? (
                  <div className="wallet-list">
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="wallet-card-wrap">
                        <article
                          onClick={() => selectMode && handleSelectWallet(wallet)}
                          className={`wallet-card${selectMode ? " is-selectable" : " is-compact"}${wallet.isDefault ? " is-default" : ""}`}
                          data-testid={`wallet-card-${wallet.id}`}
                        >
                          {selectMode ? (
                            <div className="wallet-card-copy">
                              <div className="wallet-card-brand">
                                <div className="wallet-card-brand-start">
                                  <img
                                    className="wallet-card-icon"
                                    src={getWalletOperatorIcon(wallet.paymentMethod)}
                                    alt=""
                                    aria-hidden="true"
                                  />
                                  <p className="wallet-card-method">{wallet.paymentMethod}</p>
                                </div>
                                <span className="wallet-card-type">RETRAIT</span>
                              </div>
                              <p className="wallet-card-number">{maskWalletNumber(wallet.accountNumber)}</p>
                              <div className="wallet-card-bottomline">
                                <span className="wallet-card-network">
                                  <Wifi size={17} aria-hidden="true" />
                                  <span>
                                    {apiCountries.find((country) => country.code === wallet.country)?.name || wallet.country || "Compte de retrait"}
                                  </span>
                                </span>
                                <span className="wallet-card-chip" aria-hidden="true" />
                              </div>
                            </div>
                          ) : (
                            <div className="wallet-account-row">
                              <span className="wallet-account-icon" aria-hidden="true">
                                <CreditCard size={23} strokeWidth={2} />
                              </span>
                              <div className="wallet-account-copy">
                                <p className="wallet-account-method">{wallet.paymentMethod}</p>
                                <p className="wallet-account-name">{wallet.accountName}</p>
                                <p className="wallet-account-number">{wallet.accountNumber}</p>
                              </div>
                              <div className="wallet-card-actions">
                                {wallet.isDefault ? (
                                  <span
                                    className="wallet-default-indicator"
                                    role="img"
                                    aria-label="Compte par défaut"
                                    title="Compte par défaut"
                                  >
                                    <Check size={17} aria-hidden="true" />
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setDefaultMutation.mutate(wallet.id)}
                                    disabled={setDefaultMutation.isPending}
                                    className="wallet-icon-action"
                                    data-testid={`button-set-default-${wallet.id}`}
                                    aria-label="Définir comme compte par défaut"
                                    title="Définir comme compte par défaut"
                                  >
                                    <Check size={17} aria-hidden="true" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteMutation.mutate(wallet.id)}
                                  disabled={deleteMutation.isPending}
                                  className="wallet-icon-action"
                                  data-testid={`button-delete-wallet-${wallet.id}`}
                                  aria-label="Supprimer ce compte"
                                  title="Supprimer ce compte"
                                >
                                  <Trash2 size={17} aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          )}

                          {selectMode && <ChevronRight size={18} className="text-white flex-shrink-0" />}
                        </article>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wallet-empty">
                    <img src={emptyIllustration} alt="" />
                    <p>Aucun compte bancaire enregistré</p>
                    <p>Ajoutez un compte pour effectuer vos retraits.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        {!selectMode && (
          <div className="wallet-scene-add">
            <button
              onClick={() => setShowForm(true)}
              className="wallet-primary"
              data-testid="button-add-wallet"
            >
              <Plus size={18} />
              Ajouter
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
