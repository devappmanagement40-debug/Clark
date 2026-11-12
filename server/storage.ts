import { 
  users, products, userProducts, deposits, withdrawals, withdrawalWallets,
  withdrawalFeePayments,
  paymentChannels, paymentNumbers, stakingProducts, userStakings, referralCommissions, tasks, userTasks, transactions, platformSettings, adminAuditLog,
  giftCodes, giftCodeClaims, countries, clapayPayouts, wheelSpinCredits, wheelRewardRecords,
  type User, type Product, type UserProduct, type Deposit, type Withdrawal, type WithdrawalWallet,
  type PaymentChannel, type PaymentNumber, type StakingProduct, type UserStaking, type ReferralCommission, type Task, type InsertTask, type UserTask, type Transaction, type PlatformSetting,
  type GiftCode, type GiftCodeClaim, type Country,
  type WithdrawalFeePayment, type ClapayPayout
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, or, isNull, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { getDemoReferralPreview } from "./demo-referrals";
import { notifyTelegramPaymentEvent } from "./telegram-events";
import {
  allocateEarningsWithdrawal,
  allocatePurchase,
  deriveWalletBalances,
  getTotalIncomeCredit,
  sumRecordedIncomeCredits,
  type WalletAllocation,
  type WalletBalanceSummary,
} from "@shared/wallet-balances";
import { isPurchaseLimitReached } from "@shared/product-purchase-limit";
import {
  DEFAULT_DEPOSIT_COMMISSION_LEVEL1,
  DEFAULT_DEPOSIT_COMMISSION_LEVEL2,
  DEFAULT_DEPOSIT_COMMISSION_LEVEL3,
  DEFAULT_PURCHASE_COMMISSION_LEVEL1,
  DEFAULT_PURCHASE_COMMISSION_LEVEL2,
  DEFAULT_PURCHASE_COMMISSION_LEVEL3,
  DEFAULT_SIGNUP_BONUS,
  readPercentageSetting,
} from "@shared/platform-settings";
import { countPurchasedReferrals } from "./task-referral-count";

type WalletCreditKind = "deposit" | "earnings";
type WalletSpendKind = "deposit-first" | "earnings-only";
type WalletTransactionData = Pick<Transaction, "type" | "description"> & Partial<Pick<Transaction, "amount">>;
type WithdrawalCreationData = Pick<Withdrawal, "userId" | "amount" | "netAmount" | "fees" | "accountName" | "accountNumber" | "country" | "paymentMethod" | "status">;
type WalletUserPatch = Omit<Partial<User>, "balance" | "depositBalance" | "earningsBalance" | "walletActivatedAt" | "todayEarnings" | "totalEarnings"> & {
  todayEarningsDelta?: number;
  totalEarningsDelta?: number;
};

type TeamStats = {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  demoMemberCount: number;
  totalCommission: number;
  level1Commission: number;
  level2Commission: number;
  level3Commission: number;
  level1Invested: number;
  level2Invested: number;
  level3Invested: number;
  level1Recharged: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  todayNewMembers: number;
  todayDepositAmount: number;
  todayWithdrawalAmount: number;
};

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getWalletBalances(userId: number): Promise<WalletBalanceSummary>;
  getLifetimeIncome(userId: number): Promise<number>;
  getWithdrawableBalance(userId: number): Promise<string>;
  creditWallet(userId: number, kind: WalletCreditKind, amount: number, transaction: WalletTransactionData, patch?: WalletUserPatch): Promise<User>;
  creditWalletBalancesWithAudit(userId: number, adminId: number, depositAmount: number, earningsAmount: number): Promise<WalletBalanceSummary>;
  spendWallet<T = undefined>(userId: number, amount: number, kind: WalletSpendKind, transaction: WalletTransactionData, patch?: WalletUserPatch, withinTransaction?: (tx: any) => Promise<T>): Promise<{ user: User; allocation: WalletAllocation; result: T | undefined }>;
  createWithdrawalFromEarnings(userId: number, amount: number, data: WithdrawalCreationData): Promise<Withdrawal>;
  setWalletTotal(userId: number, total: number, description: string): Promise<void>;
  getUserByPhone(phone: string, country: string): Promise<User | undefined>;
  getUserByPhoneAnyCountry(phone: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(filter?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  
  // Products
  getProducts(includeInactive?: boolean): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: Partial<Product>): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // User Products
  getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]>;
  getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]>;
  purchaseProduct(userId: number, productId: number, assignedByAdmin?: boolean): Promise<UserProduct>;
  getWheelSpinCount(userId: number): Promise<number>;
  getWheelRewardHistory(userId: number): Promise<Array<{
    id: number;
    prizeName: string;
    prizeValue: string;
    status: string;
    createdAt: Date;
  }>>;
  removeUserProduct(userId: number, productId: number): Promise<void>;
  updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct>;
  processEarnings(): Promise<void>;
  
  // Deposits
  createDeposit(data: Partial<Deposit>): Promise<Deposit>;
  getDeposit(id: number): Promise<Deposit | undefined>;
  getDepositBySendavapayReference(reference: string): Promise<Deposit | undefined>;
  getDepositByInpayOutTradeNo(reference: string): Promise<Deposit | undefined>;
  getDepositByWestpayReference(reference: string): Promise<Deposit | undefined>;
  getDepositByAshtechReference(reference: string): Promise<Deposit | undefined>;
  getDepositByAshtechTransactionId(transactionId: string): Promise<Deposit | undefined>;
  getPendingAshtechDeposits(): Promise<Deposit[]>;
  claimDepositApproval(id: number): Promise<Deposit | undefined>;
  claimAdminDepositApproval(id: number, processedBy: number): Promise<Deposit | undefined>;
  getDeposits(status?: string): Promise<(Deposit & { user: User })[]>;
  getUserDeposits(userId: number): Promise<Deposit[]>;
  updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit>;
  cleanupDepositScreenshots(): Promise<void>;
  processDepositReferralCommissions(userId: number, amount: number): Promise<void>;
  
  // Withdrawals
  createWithdrawalFeePayment(data: Partial<WithdrawalFeePayment>): Promise<WithdrawalFeePayment>;
  getWithdrawalFeePayment(id: number): Promise<WithdrawalFeePayment | undefined>;
  getActiveWithdrawalFeePayment(userId: number, withdrawalAmount: number): Promise<WithdrawalFeePayment | undefined>;
  markWithdrawalFeePaymentPaid(id: number, depositId: number): Promise<WithdrawalFeePayment | undefined>;
  claimWithdrawalFeePayment(userId: number, withdrawalAmount: number): Promise<WithdrawalFeePayment | undefined>;
  createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal>;
  getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  getWithdrawalByInpayOutTradeNo(reference: string): Promise<Withdrawal | undefined>;
  updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal>;
  claimWithdrawalFinalization(id: number, status: "approved" | "rejected"): Promise<Withdrawal | undefined>;
  getUserWithdrawalCountToday(userId: number): Promise<number>;

  // Clapay payouts
  createClapayPayoutOnce(data: Omit<ClapayPayout, "id" | "createdAt" | "updatedAt">): Promise<{ payout: ClapayPayout; created: boolean }>;
  getClapayPayouts(limit?: number): Promise<ClapayPayout[]>;
  getClapayPayout(id: number): Promise<ClapayPayout | undefined>;
  getClapayPayoutByIdempotencyKey(key: string): Promise<ClapayPayout | undefined>;
  getClapayPayoutByTransactionId(transactionId: string): Promise<ClapayPayout | undefined>;
  getOpenClapayPayout(country: string, phone: string, amount: number, operatorCode: string): Promise<ClapayPayout | undefined>;
  updateClapayPayout(
    id: number,
    data: Partial<Pick<ClapayPayout, "signature" | "status" | "providerStatus" | "message" | "processedAt">>,
  ): Promise<ClapayPayout | undefined>;
  claimClapayPayoutFinalization(
    id: number,
    status: "approved" | "rejected",
    providerStatus: string,
  ): Promise<ClapayPayout | undefined>;
  
  // Wallets
  getWallets(userId: number): Promise<WithdrawalWallet[]>;
  createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet>;
  deleteWallet(id: number): Promise<void>;
  setDefaultWallet(userId: number, walletId: number): Promise<void>;
  getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined>;
  
  // Payment Channels
  getPaymentChannels(): Promise<PaymentChannel[]>;
  getActivePaymentChannels(): Promise<PaymentChannel[]>;
  getPaymentChannel(id: number): Promise<PaymentChannel | undefined>;
  createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel>;
  deletePaymentChannel(id: number): Promise<void>;
  
  // Referrals
  getReferrals(userId: number, level: number): Promise<User[]>;
  createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission>;
  getUserCommissions(userId: number): Promise<number>;
  getTeamStats(userId: number): Promise<TeamStats>;
  getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getAdminTasks(): Promise<Task[]>;
  getAdminTask(id: number): Promise<Task | undefined>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  getTasksWithStatus(userId: number): Promise<(Task & { isCompleted: boolean; canClaim: boolean; currentInvites: number })[]>;
  claimTask(userId: number, taskId: number): Promise<void>;
  
  // Transactions
  createTransaction(data: Partial<Transaction>): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Settings
  getSetting(key: string): Promise<string | null>;
  getSettings(): Promise<Record<string, string>>;
  setSetting(key: string, value: string, modifiedBy?: number): Promise<void>;
  
  // Admin
  getStats(): Promise<any>;
  logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void>;
  resetStats(): Promise<void>;
  
  // Gift Codes
  getAllGiftCodes(): Promise<GiftCode[]>;
  getGiftCodeByCode(code: string): Promise<GiftCode | undefined>;
  createGiftCode(data: { code: string; amount: string; maxUses: number; expiresAt: Date; createdBy: number }): Promise<GiftCode>;
  deleteGiftCode(id: number): Promise<void>;
  hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean>;
  claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void>;

  // Countries
  getCountries(): Promise<Country[]>;
  getActiveCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  createCountry(data: Partial<Country>): Promise<Country>;
  updateCountry(id: number, data: Partial<Country>): Promise<Country>;
  deleteCountry(id: number): Promise<void>;

  // Payment Numbers
  getPaymentNumbers(): Promise<PaymentNumber[]>;
  getPaymentNumber(id: number): Promise<PaymentNumber | undefined>;
  getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]>;
  createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber>;
  deletePaymentNumber(id: number): Promise<void>;

  // Staking
  getStakingProducts(): Promise<StakingProduct[]>;
  getActiveStakingProducts(): Promise<StakingProduct[]>;
  getStakingProduct(id: number): Promise<StakingProduct | undefined>;
  createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct>;
  updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct>;
  deleteStakingProduct(id: number): Promise<void>;
  purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking>;
  getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]>;
  getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]>;
  releaseMaturedStakings(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  private parseWalletImpact(value: string | null): {
    depositDelta: number;
    earningsDelta: number;
    legacyDepositDelta: number;
    legacyEarningsDelta: number;
  } | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      const fields = ["depositDelta", "earningsDelta", "legacyDepositDelta", "legacyEarningsDelta"] as const;
      if (fields.some((field) => !Number.isFinite(Number(parsed?.[field])))) return null;
      return {
        depositDelta: Number(parsed.depositDelta),
        earningsDelta: Number(parsed.earningsDelta),
        legacyDepositDelta: Number(parsed.legacyDepositDelta),
        legacyEarningsDelta: Number(parsed.legacyEarningsDelta),
      };
    } catch {
      return null;
    }
  }

  private async calculateWalletBalances(executor: any, user: User): Promise<WalletBalanceSummary> {
    const activationDate = user.walletActivatedAt ? new Date(user.walletActivatedAt) : new Date();
    const [approvedDeposits, userTransactions] = await Promise.all([
      executor.select({
        amount: deposits.amount,
        withdrawalFeePaymentId: deposits.withdrawalFeePaymentId,
        status: deposits.status,
      }).from(deposits).where(eq(deposits.userId, user.id)),
      executor.select().from(transactions).where(eq(transactions.userId, user.id)),
    ]);

    const transactionsWithDates: Array<{
      transaction: Transaction;
      impact: ReturnType<DatabaseStorage["parseWalletImpact"]>;
      isHistorical: boolean;
    }> = (userTransactions as Transaction[]).map((transaction) => ({
      transaction,
      impact: this.parseWalletImpact(transaction.walletImpact),
      isHistorical: new Date(transaction.createdAt) < activationDate,
    }));
    let newDepositCredits = 0;
    let historicalProductSpending = 0;
    let postActivationLegacyDepositDelta = 0;
    for (const entry of transactionsWithDates) {
      if (!entry.isHistorical && entry.transaction.type === "deposit" && entry.impact) {
        newDepositCredits += Math.max(0, entry.impact.depositDelta);
      }
      if (entry.isHistorical && (entry.transaction.type === "purchase" || entry.transaction.type === "staking")) {
        historicalProductSpending += Math.max(0, -Number.parseFloat(entry.transaction.amount));
      }
      if (!entry.isHistorical && entry.impact) {
        postActivationLegacyDepositDelta += entry.impact.legacyDepositDelta;
      }
    }
    const approvedDepositPrincipal = approvedDeposits
      .filter((deposit: Deposit) => deposit.status === "approved" && !deposit.withdrawalFeePaymentId)
      .reduce((sum: number, deposit: Deposit) => sum + deposit.amount, 0);

    return deriveWalletBalances({
      totalBalance: user.balance,
      persistentDepositBalance: user.depositBalance || "0",
      persistentEarningsBalance: user.earningsBalance || "0",
      approvedLegacyDepositPrincipal: Math.max(0, approvedDepositPrincipal - newDepositCredits),
      historicalProductSpending,
      postActivationLegacyDepositDelta,
    });
  }

  async getWalletBalances(userId: number): Promise<WalletBalanceSummary> {
    const user = await this.getUser(userId);
    if (!user) {
      return {
        totalBalance: 0,
        depositBalance: 0,
        earningsBalance: 0,
        legacyDepositBalance: 0,
        legacyEarningsBalance: 0,
        persistentDepositBalance: 0,
        persistentEarningsBalance: 0,
      };
    }
    return this.calculateWalletBalances(db, user);
  }

  async getLifetimeIncome(userId: number): Promise<number> {
    const incomeTransactions = await db.select({
      type: transactions.type,
      amount: transactions.amount,
      walletImpact: transactions.walletImpact,
    }).from(transactions).where(and(
      eq(transactions.userId, userId),
      inArray(transactions.type, [
        "earning",
        "commission",
        "deposit_commission",
        "task_reward",
        "gift_code",
        "staking_release",
        "admin_adjustment",
      ]),
    ));
    return sumRecordedIncomeCredits(incomeTransactions);
  }

  async getWithdrawableBalance(userId: number): Promise<string> {
    return (await this.getWalletBalances(userId)).earningsBalance.toFixed(2);
  }

  async creditWallet(
    userId: number,
    kind: WalletCreditKind,
    amount: number,
    transaction: WalletTransactionData,
    patch: WalletUserPatch = {},
  ): Promise<User> {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Le crédit doit être positif.");
    const amountValue = amount.toFixed(2);
    const depositCredit = kind === "deposit" ? amountValue : "0.00";
    const earningsCredit = kind === "earnings" ? amountValue : "0.00";
    const { todayEarningsDelta, totalEarningsDelta, ...userPatch } = patch;
    const lifetimeIncomeDelta = getTotalIncomeCredit(kind, transaction.type, amount, totalEarningsDelta);

    return db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
      if (!user) throw new Error("Utilisateur non trouvé.");
      const userUpdates: any = {
        ...userPatch,
        balance: sql`${users.balance} + ${amountValue}::numeric`,
        depositBalance: sql`${users.depositBalance} + ${depositCredit}::numeric`,
        earningsBalance: sql`${users.earningsBalance} + ${earningsCredit}::numeric`,
      };
      if (todayEarningsDelta) {
        userUpdates.todayEarnings = sql`${users.todayEarnings} + ${todayEarningsDelta.toFixed(2)}::numeric`;
      }
      if (lifetimeIncomeDelta) {
        userUpdates.totalEarnings = sql`${users.totalEarnings} + ${lifetimeIncomeDelta.toFixed(2)}::numeric`;
      }
      const [updated] = await tx.update(users).set(userUpdates).where(eq(users.id, userId)).returning();
      const [createdTransaction] = await tx.insert(transactions).values({
        userId,
        type: transaction.type,
        amount: amountValue,
        description: transaction.description,
        walletImpact: JSON.stringify({
          depositDelta: Number(depositCredit),
          earningsDelta: Number(earningsCredit),
          legacyDepositDelta: 0,
          legacyEarningsDelta: 0,
        }),
      }).returning();
      if (!user.walletActivatedAt) {
        await tx.update(users)
          .set({ walletActivatedAt: createdTransaction.createdAt })
          .where(and(eq(users.id, userId), isNull(users.walletActivatedAt)));
      }
      return updated;
    });
  }

  async creditWalletBalancesWithAudit(
    userId: number,
    adminId: number,
    depositAmount: number,
    earningsAmount: number,
  ): Promise<WalletBalanceSummary> {
    const amounts = [depositAmount, earningsAmount];
    if (
      amounts.some((amount) => !Number.isSafeInteger(amount) || amount < 0 || amount > 100_000_000) ||
      depositAmount + earningsAmount <= 0
    ) {
      throw new Error("Saisissez des crédits entiers positifs, dans la limite autorisée.");
    }

    const depositValue = depositAmount.toFixed(2);
    const earningsValue = earningsAmount.toFixed(2);
    const totalValue = (depositAmount + earningsAmount).toFixed(2);

    return db.transaction(async (tx) => {
      const [admin] = await tx.select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
        .from(users)
        .where(eq(users.id, adminId))
        .for("update");
      if (!admin?.isSuperAdmin) throw new Error("Action réservée au super administrateur.");

      const [targetUser] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
      if (!targetUser) throw new Error("Utilisateur non trouvé.");

      const [updatedUser] = await tx.update(users).set({
        balance: sql`${users.balance} + ${totalValue}::numeric`,
        depositBalance: sql`${users.depositBalance} + ${depositValue}::numeric`,
        earningsBalance: sql`${users.earningsBalance} + ${earningsValue}::numeric`,
        ...(earningsAmount > 0
          ? { totalEarnings: sql`${users.totalEarnings} + ${earningsValue}::numeric` }
          : {}),
      }).where(eq(users.id, userId)).returning();

      const walletCredits = [
        depositAmount > 0
          ? {
              amount: depositValue,
              description: "Crédit administrateur du solde des dépôts",
              walletImpact: {
                depositDelta: depositAmount,
                earningsDelta: 0,
                legacyDepositDelta: 0,
                legacyEarningsDelta: 0,
              },
            }
          : null,
        earningsAmount > 0
          ? {
              amount: earningsValue,
              description: "Crédit administrateur des revenus cumulés retirables",
              walletImpact: {
                depositDelta: 0,
                earningsDelta: earningsAmount,
                legacyDepositDelta: 0,
                legacyEarningsDelta: 0,
              },
            }
          : null,
      ].filter((credit): credit is NonNullable<typeof credit> => credit !== null);

      let activationAt = targetUser.walletActivatedAt;
      for (const credit of walletCredits) {
        const [createdTransaction] = await tx.insert(transactions).values({
          userId,
          type: "admin_adjustment",
          amount: credit.amount,
          description: credit.description,
          walletImpact: JSON.stringify(credit.walletImpact),
        }).returning();
        if (!activationAt) activationAt = createdTransaction.createdAt;
      }

      let finalUser = updatedUser;
      if (!targetUser.walletActivatedAt && activationAt) {
        [finalUser] = await tx.update(users)
          .set({ walletActivatedAt: activationAt })
          .where(eq(users.id, userId))
          .returning();
      }

      await tx.insert(adminAuditLog).values({
        adminId,
        action: "credit_wallet_balances",
        targetUserId: userId,
        details: `Crédit administrateur : dépôts +${depositValue}, revenus cumulés +${earningsValue}`,
      });

      return this.calculateWalletBalances(tx, finalUser);
    });
  }

  async spendWallet(
    userId: number,
    amount: number,
    kind: WalletSpendKind,
    transaction: WalletTransactionData,
    patch: WalletUserPatch = {},
    withinTransaction?: (tx: any) => Promise<any>,
  ): Promise<{ user: User; allocation: WalletAllocation; result: any }> {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Le débit doit être positif.");
    const amountValue = amount.toFixed(2);

    return db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
      if (!user) throw new Error("Utilisateur non trouvé.");
      const wallets = await this.calculateWalletBalances(tx, user);
      const allocation = kind === "deposit-first"
        ? allocatePurchase(wallets, amountValue)
        : allocateEarningsWithdrawal(wallets, amountValue);
      if (!allocation.canSpend) {
        throw new Error(kind === "deposit-first"
          ? "Solde insuffisant : les dépôts et les revenus cumulés disponibles ne couvrent pas cet achat."
          : "Le solde des revenus cumulés est insuffisant pour ce retrait.");
      }
      const [updated] = await tx.update(users).set({
        ...patch,
        balance: sql`${users.balance} - ${amountValue}::numeric`,
        depositBalance: sql`${users.depositBalance} + ${allocation.persistentDepositDelta.toFixed(2)}::numeric`,
        earningsBalance: sql`${users.earningsBalance} + ${allocation.persistentEarningsDelta.toFixed(2)}::numeric`,
      }).where(eq(users.id, userId)).returning();
      const [createdTransaction] = await tx.insert(transactions).values({
        userId,
        type: transaction.type,
        amount: (-amount).toFixed(2),
        description: transaction.description,
        walletImpact: JSON.stringify({
          depositDelta: allocation.depositDelta,
          earningsDelta: allocation.earningsDelta,
          legacyDepositDelta: allocation.legacyDepositDelta,
          legacyEarningsDelta: allocation.legacyEarningsDelta,
        }),
      }).returning();
      const result = withinTransaction ? await withinTransaction(tx) : undefined;
      if (!user.walletActivatedAt) {
        await tx.update(users)
          .set({ walletActivatedAt: createdTransaction.createdAt })
          .where(and(eq(users.id, userId), isNull(users.walletActivatedAt)));
      }
      return { user: updated, allocation, result };
    });
  }

  async setWalletTotal(userId: number, total: number, description: string): Promise<void> {
    if (!Number.isFinite(total) || total < 0) throw new Error("Le solde demandé est invalide.");
    const current = await this.getWalletBalances(userId);
    const difference = Math.round((total - current.totalBalance) * 100) / 100;
    if (difference > 0) {
      await this.creditWallet(userId, "earnings", difference, {
        type: "admin_adjustment",
        description,
      });
    } else if (difference < 0) {
      await this.spendWallet(userId, -difference, "deposit-first", {
        type: "admin_adjustment",
        description,
      });
    }
  }

  async getUserByPhone(phone: string, country: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.phone, phone), eq(users.country, country)));
    return user || undefined;
  }

  async getUserByPhoneAnyCountry(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`UPPER(${users.referralCode}) = UPPER(${code})`
    );
    return user || undefined;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const hashedPassword = await bcrypt.hash(data.password!, 10);

    // Get signup bonus from settings (default 500); signup bonuses belong to the
    // deposit wallet, where they can fund purchases but cannot be withdrawn.
    let signupBonus = "500";
    try {
      const settings = await this.getSettings();
      signupBonus = settings.signupBonus || String(DEFAULT_SIGNUP_BONUS);
    } catch {}

    const [user] = await db.insert(users).values({
      ...data,
      password: hashedPassword,
      referralCode,
      balance: signupBonus,
      depositBalance: signupBonus,
      earningsBalance: "0",
      walletActivatedAt: new Date(),
    } as any).returning();
    
    await this.createTransaction({
      userId: user.id,
      type: "bonus",
      amount: signupBonus,
      description: "Bonus d'inscription",
      walletImpact: JSON.stringify({
        depositDelta: Number(signupBonus),
        earningsDelta: 0,
        legacyDepositDelta: 0,
        legacyEarningsDelta: 0,
      }),
    });
    
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(filter?: string, limit: number = 50, offset: number = 0): Promise<{ users: User[], total: number }> {
    let conditions: any[] = [];
    
    if (filter && filter.trim()) {
      const searchTerm = `%${filter.trim().toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${users.phone}) LIKE ${searchTerm}`,
          sql`LOWER(${users.fullName}) LIKE ${searchTerm}`,
          sql`LOWER(${users.referralCode}) LIKE ${searchTerm}`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
    
    const userList = await db.select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { users: userList, total: Number(countResult.count) };
  }

  // Products
  async getProducts(includeInactive = false): Promise<Product[]> {
    if (includeInactive) {
      return await db.select().from(products).orderBy(products.sortOrder);
    }
    return await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(products.sortOrder);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const [product] = await db.insert(products).values(data as any).returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // User Products
  async getUserProducts(userId: number): Promise<(UserProduct & { product: Product })[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    
    return result.map(r => ({ ...r.userProduct, product: r.product }));
  }

  async getAllUserProducts(userId: number): Promise<{ userProduct: UserProduct; product: Product }[]> {
    const result = await db.select({
      userProduct: userProducts,
      product: products,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .where(eq(userProducts.userId, userId));
    
    return result.sort((a, b) => {
      const dateA = a.userProduct.purchaseDate ? new Date(a.userProduct.purchaseDate).getTime() : 0;
      const dateB = b.userProduct.purchaseDate ? new Date(b.userProduct.purchaseDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  async purchaseProduct(userId: number, productId: number, assignedByAdmin = false): Promise<UserProduct> {
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Produit non trouvé");
    if (!product.isActive && !assignedByAdmin) throw new Error("Produit indisponible");

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    let userProduct: UserProduct | undefined;
    if (!product.isFree && !assignedByAdmin) {
      const directReferrer = user.referredBy
        ? await this.getUserByReferralCode(user.referredBy)
        : undefined;
      // Check if this is user's first paid investment
      const existingPaidProducts = await db.select()
        .from(userProducts)
        .innerJoin(products, eq(userProducts.productId, products.id))
        .where(and(
          eq(userProducts.userId, userId),
          eq(products.isFree, false),
          eq(userProducts.assignedByAdmin, false)
        ));
      
      const isFirstInvestment = existingPaidProducts.length === 0;
      
      const result = await this.spendWallet(userId, product.price, "deposit-first", {
        type: "purchase",
        description: `Achat ${product.name}`,
      }, { hasActiveProduct: true }, async (tx) => {
        if (product.purchaseLimitPerUser !== null && product.purchaseLimitPerUser !== undefined) {
          const [purchaseCountRow] = await tx.select({
            count: sql<number>`count(*)`,
          }).from(userProducts).where(and(
            eq(userProducts.userId, userId),
            eq(userProducts.productId, productId),
            eq(userProducts.assignedByAdmin, false),
          ));
          if (isPurchaseLimitReached(product.purchaseLimitPerUser, Number(purchaseCountRow?.count ?? 0))) {
            throw new Error("Vous avez déjà atteint la limite d'achat de cette offre.");
          }
        }

        const [created] = await tx.insert(userProducts).values({
          userId,
          productId,
          daysRemaining: product.cycleDays,
          assignedByAdmin,
          lastEarningDate: new Date(),
        }).returning();
        await tx.insert(wheelSpinCredits).values({
          userId,
          sourceUserProductId: created.id,
          sourceType: "purchase",
        }).onConflictDoNothing();
        if (directReferrer && directReferrer.id !== userId) {
          await tx.insert(wheelSpinCredits).values({
            userId: directReferrer.id,
            sourceUserProductId: created.id,
            sourceType: "referral_purchase",
          }).onConflictDoNothing();
        }
        return created;
      });
      userProduct = result.result;

      // Process referral commissions ONLY on first investment
      if (isFirstInvestment) {
        await this.processReferralCommissions(userId, product.price, productId);
      }
    } else {
      await this.updateUser(userId, { hasActiveProduct: true });
      // Set lastEarningDate to now - first earnings will be credited 24h after purchase.
      [userProduct] = await db.insert(userProducts).values({
        userId,
        productId,
        daysRemaining: product.cycleDays,
        assignedByAdmin,
        lastEarningDate: new Date(),
      }).returning();
    }

    if (!userProduct) throw new Error("Impossible de créer l'offre de l'utilisateur.");
    return userProduct;
  }

  async getWheelSpinCount(userId: number): Promise<number> {
    const [result] = await db.select({
      count: sql<number>`count(*)`,
    }).from(wheelSpinCredits).where(eq(wheelSpinCredits.userId, userId));
    return Number(result?.count ?? 0);
  }

  async getWheelRewardHistory(userId: number) {
    return db.select({
      id: wheelRewardRecords.id,
      prizeName: wheelRewardRecords.prizeName,
      prizeValue: wheelRewardRecords.prizeValue,
      status: wheelRewardRecords.status,
      createdAt: wheelRewardRecords.createdAt,
    })
      .from(wheelRewardRecords)
      .where(eq(wheelRewardRecords.userId, userId))
      .orderBy(desc(wheelRewardRecords.createdAt), desc(wheelRewardRecords.id))
      .limit(100);
  }

  async updateUserProduct(id: number, data: Partial<UserProduct>): Promise<UserProduct> {
    const [updated] = await db.update(userProducts)
      .set(data as any)
      .where(eq(userProducts.id, id))
      .returning();
    return updated;
  }

  async removeUserProduct(userId: number, productId: number): Promise<void> {
    await db.update(userProducts)
      .set({ isActive: false })
      .where(and(eq(userProducts.userId, userId), eq(userProducts.productId, productId)));
  }

  async processReferralCommissions(userId: number, amount: number, productId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const level1Rate = readPercentageSetting(settings.level1Commission, DEFAULT_PURCHASE_COMMISSION_LEVEL1) / 100;
    const level2Rate = readPercentageSetting(settings.level2Commission, DEFAULT_PURCHASE_COMMISSION_LEVEL2) / 100;
    const level3Rate = readPercentageSetting(settings.level3Commission, DEFAULT_PURCHASE_COMMISSION_LEVEL3) / 100;

    // Level 1
    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission = amount * level1Rate;
      await this.creditWallet(level1User.id, "earnings", commission, {
        type: "commission",
        amount: commission.toFixed(2),
        description: `Commission niveau 1 de ${user.fullName}`,
      });
      await this.createReferralCommission({
        userId: level1User.id,
        fromUserId: userId,
        level: 1,
        amount: commission.toFixed(2),
        productId,
      });
      // Level 2
      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const commission2 = amount * level2Rate;
          await this.creditWallet(level2User.id, "earnings", commission2, {
            type: "commission",
            amount: commission2.toFixed(2),
            description: `Commission niveau 2`,
          });
          await this.createReferralCommission({
            userId: level2User.id,
            fromUserId: userId,
            level: 2,
            amount: commission2.toFixed(2),
            productId,
          });
          // Level 3
          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const commission3 = amount * level3Rate;
              await this.creditWallet(level3User.id, "earnings", commission3, {
                type: "commission",
                amount: commission3.toFixed(2),
                description: `Commission niveau 3`,
              });
              await this.createReferralCommission({
                userId: level3User.id,
                fromUserId: userId,
                level: 3,
                amount: commission3.toFixed(2),
                productId,
              });
            }
          }
        }
      }
    }
  }

  async processEarnings(): Promise<void> {
    const activeProducts = await db.select({
      userProduct: userProducts,
      product: products,
      user: users,
    }).from(userProducts)
      .innerJoin(products, eq(userProducts.productId, products.id))
      .innerJoin(users, eq(userProducts.userId, users.id))
      .where(and(eq(userProducts.isActive, true), sql`${userProducts.daysRemaining} > 0`));

    const now = new Date();
    
    const userEarnings = new Map<number, number>();
    
    for (const { userProduct, product, user } of activeProducts) {
      try {
        const purchaseDate = userProduct.purchaseDate ? new Date(userProduct.purchaseDate) : null;
        if (!purchaseDate) continue;

        const lastEarning = userProduct.lastEarningDate ? new Date(userProduct.lastEarningDate) : purchaseDate;

        const msSincePurchase = now.getTime() - purchaseDate.getTime();
        const daysSincePurchase = Math.floor(msSincePurchase / (24 * 60 * 60 * 1000));

        const msSinceLastEarning = now.getTime() - lastEarning.getTime();
        const cyclesSinceLastEarning = Math.floor(msSinceLastEarning / (24 * 60 * 60 * 1000));

        if (cyclesSinceLastEarning >= 1 && daysSincePurchase >= 1) {
          const cyclesToCredit = Math.min(cyclesSinceLastEarning, userProduct.daysRemaining);
          const earningsPerCycle = product.dailyEarnings;
          const totalEarningsForProduct = earningsPerCycle * cyclesToCredit;

          const newLastEarningDate = new Date(lastEarning.getTime() + (cyclesToCredit * 24 * 60 * 60 * 1000));

          const currentTotal = userEarnings.get(user.id) || 0;
          userEarnings.set(user.id, currentTotal + totalEarningsForProduct);

          const newDaysRemaining = userProduct.daysRemaining - cyclesToCredit;
          const updateData: any = {
            lastEarningDate: newLastEarningDate,
            daysRemaining: newDaysRemaining,
            totalEarned: (parseFloat(userProduct.totalEarned || "0") + totalEarningsForProduct).toFixed(2),
          };
          
          if (newDaysRemaining <= 0) {
            updateData.isActive = false;
          }

          await db.update(userProducts).set(updateData).where(eq(userProducts.id, userProduct.id));

        }
      } catch (productError) {
        console.error(`processEarnings error for product ${userProduct.id}:`, productError);
      }
    }

    for (const [userId, totalEarnings] of Array.from(userEarnings.entries())) {
      try {
        const freshUser = await this.getUser(userId);
        if (freshUser) {
          await this.creditWallet(userId, "earnings", totalEarnings, {
            type: "earning",
            description: "Gains quotidiens des produits",
          }, {
            todayEarningsDelta: totalEarnings,
            totalEarningsDelta: totalEarnings,
          });
        }
      } catch (userError) {
        console.error(`processEarnings user update error for user ${userId}:`, userError);
      }
    }
  }

  // Deposits
  async createDeposit(data: Partial<Deposit>): Promise<Deposit> {
    const [deposit] = await db.insert(deposits).values(data as any).returning();
    notifyTelegramPaymentEvent({
      kind: "deposit",
      phase: "created",
      id: deposit.id,
      userId: deposit.userId,
      amount: deposit.amount,
      status: deposit.status,
      country: deposit.country,
      paymentMethod: deposit.paymentMethod,
      reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
      isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
    });
    return deposit;
  }

  async getDeposit(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async getDepositBySendavapayReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.sendavapayReference, reference));
    return deposit;
  }

  async getDepositByInpayOutTradeNo(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.inpayOutTradeNo, reference));
    return deposit;
  }

  async getDepositByWestpayReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.westpayReference, reference));
    return deposit;
  }

  async getDepositByAshtechReference(reference: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.ashtechReference, reference));
    return deposit;
  }

  async getDepositByAshtechTransactionId(transactionId: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.ashtechTransactionId, transactionId));
    return deposit;
  }

  async getPendingAshtechDeposits(): Promise<Deposit[]> {
    return db.select().from(deposits).where(and(
      sql`${deposits.ashtechTransactionId} IS NOT NULL`,
      or(eq(deposits.status, "pending"), eq(deposits.status, "processing")),
    ));
  }

  async claimDepositApproval(id: number): Promise<Deposit | undefined> {
    const [deposit] = await db.update(deposits)
      .set({ status: "approved", processedAt: new Date() })
      .where(and(
        eq(deposits.id, id),
        sql`${deposits.status} NOT IN ('approved', 'rejected')`,
        isNull(deposits.processedAt),
      ))
      .returning();
    if (deposit) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        status: deposit.status,
        country: deposit.country,
        paymentMethod: deposit.paymentMethod,
        reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
        isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
      });
    }
    return deposit;
  }

  async claimAdminDepositApproval(id: number, processedBy: number): Promise<Deposit | undefined> {
    const [deposit] = await db.update(deposits)
      .set({ status: "approved", processedAt: new Date(), processedBy })
      .where(and(
        eq(deposits.id, id),
        sql`${deposits.status} <> 'approved'`,
      ))
      .returning();
    if (deposit) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        status: deposit.status,
        country: deposit.country,
        paymentMethod: deposit.paymentMethod,
        reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
        isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
      });
    }
    return deposit;
  }

  async getDeposits(status?: string): Promise<(Deposit & { user: User })[]> {
    let query = db.select({
      deposit: deposits,
      user: users,
    }).from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .orderBy(desc(deposits.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(deposits.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.deposit, user: r.user }));
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  }

  async updateDeposit(id: number, data: Partial<Deposit>): Promise<Deposit> {
    const previous = data.status !== undefined ? await this.getDeposit(id) : undefined;
    const [deposit] = await db.update(deposits).set(data).where(eq(deposits.id, id)).returning();
    if (deposit && data.status !== undefined && previous?.status !== deposit.status) {
      notifyTelegramPaymentEvent({
        kind: "deposit",
        phase: "status",
        id: deposit.id,
        userId: deposit.userId,
        amount: deposit.amount,
        status: deposit.status,
        country: deposit.country,
        paymentMethod: deposit.paymentMethod,
        reference: deposit.reference || deposit.inpayOutTradeNo || deposit.westpayReference || deposit.ashtechReference || deposit.sendavapayReference,
        isWithdrawalFeePayment: Boolean(deposit.withdrawalFeePaymentId),
      });
    }
    return deposit;
  }

  async cleanupDepositScreenshots(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.update(deposits)
      .set({ screenshot: null })
      .where(
        and(
          sql`${deposits.screenshot} IS NOT NULL`,
          or(
            and(eq(deposits.status, "approved"), lte(deposits.processedAt, cutoff)),
            and(eq(deposits.status, "rejected"), lte(deposits.processedAt, cutoff)),
          )
        )
      );
  }

  async processDepositReferralCommissions(userId: number, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user || !user.referredBy) return;

    const settings = await this.getSettings();
    const level1Rate = readPercentageSetting(settings.depositCommissionLevel1, DEFAULT_DEPOSIT_COMMISSION_LEVEL1) / 100;
    const level2Rate = readPercentageSetting(settings.depositCommissionLevel2, DEFAULT_DEPOSIT_COMMISSION_LEVEL2) / 100;
    const level3Rate = readPercentageSetting(settings.depositCommissionLevel3, DEFAULT_DEPOSIT_COMMISSION_LEVEL3) / 100;

    const level1User = await this.getUserByReferralCode(user.referredBy);
    if (level1User) {
      const commission = Math.round(amount * level1Rate);
      if (commission > 0) {
        await this.creditWallet(level1User.id, "earnings", commission, {
          type: "deposit_commission",
          amount: commission.toString(),
          description: `Commission depot niveau 1`,
        });
      }

      if (level1User.referredBy) {
        const level2User = await this.getUserByReferralCode(level1User.referredBy);
        if (level2User) {
          const comm2 = Math.round(amount * level2Rate);
          if (comm2 > 0) {
            await this.creditWallet(level2User.id, "earnings", comm2, {
              type: "deposit_commission",
              amount: comm2.toString(),
              description: `Commission depot niveau 2`,
            });
          }

          if (level2User.referredBy) {
            const level3User = await this.getUserByReferralCode(level2User.referredBy);
            if (level3User) {
              const comm3 = Math.round(amount * level3Rate);
              if (comm3 > 0) {
              await this.creditWallet(level3User.id, "earnings", comm3, {
                  type: "deposit_commission",
                  amount: comm3.toString(),
                  description: `Commission depot niveau 3`,
                });
              }
            }
          }
        }
      }
    }
  }

  // Withdrawals
  async createWithdrawalFeePayment(data: Partial<WithdrawalFeePayment>): Promise<WithdrawalFeePayment> {
    const [payment] = await db.insert(withdrawalFeePayments).values(data as any).returning();
    return payment;
  }

  async getWithdrawalFeePayment(id: number): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.select().from(withdrawalFeePayments).where(eq(withdrawalFeePayments.id, id));
    return payment;
  }

  async getActiveWithdrawalFeePayment(
    userId: number,
    withdrawalAmount: number,
  ): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.select()
      .from(withdrawalFeePayments)
      .where(and(
        eq(withdrawalFeePayments.userId, userId),
        eq(withdrawalFeePayments.withdrawalAmount, withdrawalAmount),
        sql`${withdrawalFeePayments.status} IN ('pending', 'paid')`,
      ))
      .orderBy(desc(withdrawalFeePayments.createdAt))
      .limit(1);
    return payment;
  }

  async markWithdrawalFeePaymentPaid(
    id: number,
    depositId: number,
  ): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.update(withdrawalFeePayments)
      .set({ status: "paid", depositId, paidAt: new Date() })
      .where(and(
        eq(withdrawalFeePayments.id, id),
        sql`${withdrawalFeePayments.status} = 'pending'`,
      ))
      .returning();
    if (payment) return payment;
    return this.getWithdrawalFeePayment(id);
  }

  async claimWithdrawalFeePayment(
    userId: number,
    withdrawalAmount: number,
  ): Promise<WithdrawalFeePayment | undefined> {
    const [payment] = await db.update(withdrawalFeePayments)
      .set({ status: "used", usedAt: new Date() })
      .where(and(
        eq(withdrawalFeePayments.userId, userId),
        eq(withdrawalFeePayments.withdrawalAmount, withdrawalAmount),
        sql`${withdrawalFeePayments.status} = 'paid'`,
      ))
      .returning();
    return payment;
  }

  private notifyWithdrawalCreated(withdrawal: Withdrawal): void {
    notifyTelegramPaymentEvent({
      kind: "withdrawal",
      phase: "created",
      id: withdrawal.id,
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      netAmount: withdrawal.netAmount,
      status: withdrawal.status,
      country: withdrawal.country,
      paymentMethod: withdrawal.paymentMethod,
      reference: withdrawal.inpayOutTradeNo,
    });
  }

  async createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal> {
    const [withdrawal] = await db.insert(withdrawals).values(data as any).returning();
    this.notifyWithdrawalCreated(withdrawal);
    return withdrawal;
  }

  async createWithdrawalFromEarnings(
    userId: number,
    amount: number,
    data: WithdrawalCreationData,
  ): Promise<Withdrawal> {
    const { result } = await this.spendWallet(
      userId,
      amount,
      "earnings-only",
      { type: "withdrawal", description: "Retrait demandé" },
      {},
      async (tx) => {
        const [withdrawal] = await tx.insert(withdrawals).values(data as any).returning();
        return withdrawal as Withdrawal;
      },
    );
    if (!result) throw new Error("La demande de retrait n'a pas pu être créée.");
    this.notifyWithdrawalCreated(result);
    return result;
  }

  async getWithdrawals(status?: string): Promise<(Withdrawal & { user: User })[]> {
    let query = db.select({
      withdrawal: withdrawals,
      user: users,
    }).from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt));
    
    if (status && status !== "all") {
      query = query.where(eq(withdrawals.status, status)) as any;
    }
    
    const result = await query;
    return result.map(r => ({ ...r.withdrawal, user: r.user }));
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async getWithdrawalByInpayOutTradeNo(reference: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.inpayOutTradeNo, reference));
    return withdrawal;
  }

  async updateWithdrawal(id: number, data: Partial<Withdrawal>): Promise<Withdrawal> {
    const previous = data.status !== undefined ? await this.getWithdrawalById(id) : undefined;
    const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
    if (withdrawal && data.status !== undefined && previous?.status !== withdrawal.status) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
        reference: withdrawal.inpayOutTradeNo,
      });
    }
    return withdrawal;
  }

  private async getWithdrawalById(id: number): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal;
  }

  async claimWithdrawalFinalization(
    id: number,
    status: "approved" | "rejected",
  ): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.update(withdrawals)
      .set({ status, processedAt: new Date() })
      .where(and(
        eq(withdrawals.id, id),
        sql`${withdrawals.status} NOT IN ('approved', 'rejected')`,
      ))
      .returning();
    if (withdrawal) {
      notifyTelegramPaymentEvent({
        kind: "withdrawal",
        phase: "status",
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        status: withdrawal.status,
        country: withdrawal.country,
        paymentMethod: withdrawal.paymentMethod,
        reference: withdrawal.inpayOutTradeNo,
      });
    }
    return withdrawal;
  }

  async createClapayPayoutOnce(
    data: Omit<ClapayPayout, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ payout: ClapayPayout; created: boolean }> {
    const [created] = await db.insert(clapayPayouts)
      .values(data)
      .onConflictDoNothing({ target: clapayPayouts.idempotencyKey })
      .returning();
    if (created) return { payout: created, created: true };
    const existing = await this.getClapayPayoutByIdempotencyKey(data.idempotencyKey);
    if (!existing) throw new Error("Le payout Clapay n'a pas pu être créé ou relu");
    return { payout: existing, created: false };
  }

  async getClapayPayouts(limit = 100): Promise<ClapayPayout[]> {
    return db.select()
      .from(clapayPayouts)
      .orderBy(desc(clapayPayouts.createdAt))
      .limit(Math.min(Math.max(limit, 1), 200));
  }

  async getClapayPayout(id: number): Promise<ClapayPayout | undefined> {
    const [payout] = await db.select().from(clapayPayouts).where(eq(clapayPayouts.id, id));
    return payout;
  }

  async getClapayPayoutByIdempotencyKey(key: string): Promise<ClapayPayout | undefined> {
    const [payout] = await db.select()
      .from(clapayPayouts)
      .where(eq(clapayPayouts.idempotencyKey, key));
    return payout;
  }

  async getClapayPayoutByTransactionId(transactionId: string): Promise<ClapayPayout | undefined> {
    const [payout] = await db.select()
      .from(clapayPayouts)
      .where(eq(clapayPayouts.transactionId, transactionId));
    return payout;
  }

  async getOpenClapayPayout(
    country: string,
    phone: string,
    amount: number,
    operatorCode: string,
  ): Promise<ClapayPayout | undefined> {
    const [payout] = await db.select()
      .from(clapayPayouts)
      .where(and(
        eq(clapayPayouts.country, country),
        eq(clapayPayouts.recipientPhone, phone),
        eq(clapayPayouts.amount, amount),
        eq(clapayPayouts.operatorCode, operatorCode),
        inArray(clapayPayouts.status, ["initiating", "processing"]),
      ))
      .orderBy(desc(clapayPayouts.createdAt))
      .limit(1);
    return payout;
  }

  async updateClapayPayout(
    id: number,
    data: Partial<Pick<ClapayPayout, "signature" | "status" | "providerStatus" | "message" | "processedAt">>,
  ): Promise<ClapayPayout | undefined> {
    const [payout] = await db.update(clapayPayouts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(clapayPayouts.id, id),
        sql`${clapayPayouts.status} NOT IN ('approved', 'rejected', 'failed')`,
      ))
      .returning();
    return payout || this.getClapayPayout(id);
  }

  async claimClapayPayoutFinalization(
    id: number,
    status: "approved" | "rejected",
    providerStatus: string,
  ): Promise<ClapayPayout | undefined> {
    const [payout] = await db.update(clapayPayouts)
      .set({
        status,
        providerStatus,
        message: null,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(clapayPayouts.id, id),
        sql`${clapayPayouts.status} NOT IN ('approved', 'rejected', 'failed')`,
      ))
      .returning();
    return payout;
  }

  async getUserWithdrawalCountToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(and(
        eq(withdrawals.userId, userId),
        gte(withdrawals.createdAt, today)
      ));
    
    return result[0]?.count || 0;
  }

  // Wallets
  async getWallets(userId: number): Promise<WithdrawalWallet[]> {
    return await db.select().from(withdrawalWallets).where(eq(withdrawalWallets.userId, userId));
  }

  async createWallet(data: Partial<WithdrawalWallet>): Promise<WithdrawalWallet> {
    // Set other wallets as non-default
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, data.userId!));
    
    const [wallet] = await db.insert(withdrawalWallets).values({ ...data, isDefault: true } as any).returning();
    return wallet;
  }

  async deleteWallet(id: number): Promise<void> {
    await db.delete(withdrawalWallets).where(eq(withdrawalWallets.id, id));
  }

  async setDefaultWallet(userId: number, walletId: number): Promise<void> {
    await db.update(withdrawalWallets).set({ isDefault: false }).where(eq(withdrawalWallets.userId, userId));
    await db.update(withdrawalWallets).set({ isDefault: true }).where(eq(withdrawalWallets.id, walletId));
  }

  async getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined> {
    const [wallet] = await db.select().from(withdrawalWallets)
      .where(and(eq(withdrawalWallets.userId, userId), eq(withdrawalWallets.isDefault, true)));
    return wallet || undefined;
  }

  // Payment Channels
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels);
  }

  async getActivePaymentChannels(): Promise<PaymentChannel[]> {
    return await db.select().from(paymentChannels).where(eq(paymentChannels.isActive, true));
  }

  async getPaymentChannel(id: number): Promise<PaymentChannel | undefined> {
    const [channel] = await db.select().from(paymentChannels).where(eq(paymentChannels.id, id));
    return channel || undefined;
  }

  async createPaymentChannel(data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.insert(paymentChannels).values(data as any).returning();
    return channel;
  }

  async updatePaymentChannel(id: number, data: Partial<PaymentChannel>): Promise<PaymentChannel> {
    const [channel] = await db.update(paymentChannels).set({ ...data, modifiedAt: new Date() }).where(eq(paymentChannels.id, id)).returning();
    return channel;
  }

  async deletePaymentChannel(id: number): Promise<void> {
    await db.delete(paymentChannels).where(eq(paymentChannels.id, id));
  }

  // Referrals
  private async getReferralLevels(userId: number): Promise<[User[], User[], User[]]> {
    const user = await this.getUser(userId);
    if (!user) return [[], [], []];

    const level1 = await db.select().from(users)
      .where(eq(users.referredBy, user.referralCode))
      .orderBy(desc(users.createdAt), desc(users.id));
    const level1Codes = level1.map(member => member.referralCode);
    const level2 = level1Codes.length
      ? await db.select().from(users)
        .where(inArray(users.referredBy, level1Codes))
        .orderBy(desc(users.createdAt), desc(users.id))
      : [];
    const level2Codes = level2.map(member => member.referralCode);
    const level3 = level2Codes.length
      ? await db.select().from(users)
        .where(inArray(users.referredBy, level2Codes))
        .orderBy(desc(users.createdAt), desc(users.id))
      : [];

    return [level1, level2, level3];
  }

  async getReferrals(userId: number, level: number): Promise<User[]> {
    if (!Number.isInteger(level) || level < 1 || level > 3) return [];
    const levels = await this.getReferralLevels(userId);
    return levels[level - 1];
  }

  async createReferralCommission(data: Partial<ReferralCommission>): Promise<ReferralCommission> {
    const [commission] = await db.insert(referralCommissions).values(data as any).returning();
    return commission;
  }

  async getUserCommissions(userId: number): Promise<number> {
    const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    return parseFloat(result[0]?.total || "0");
  }

  async getTeamStatsSimple(userId: number): Promise<{ level1Count: number; level2Count: number; level3Count: number; totalCommission: number }> {
    const user = await this.getUser(userId);
    if (!user) return { level1Count: 0, level2Count: 0, level3Count: 0, totalCommission: 0 };

    const level1Result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referredBy, user.referralCode));
    const level1Count = Number(level1Result[0]?.count || 0);

    let level2Count = 0;
    let level3Count = 0;
    
    if (level1Count > 0) {
      const level1Codes = await db.select({ code: users.referralCode })
        .from(users)
        .where(eq(users.referredBy, user.referralCode));
      
      if (level1Codes.length > 0) {
        const level2Result = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
        level2Count = Number(level2Result[0]?.count || 0);
        
        if (level2Count > 0) {
          const level2Codes = await db.select({ code: users.referralCode })
            .from(users)
            .where(sql`${users.referredBy} IN (${sql.join(level1Codes.map(u => sql`${u.code}`), sql`, `)})`);
          
          if (level2Codes.length > 0) {
            const level3Result = await db.select({ count: sql<number>`count(*)` })
              .from(users)
              .where(sql`${users.referredBy} IN (${sql.join(level2Codes.map(u => sql`${u.code}`), sql`, `)})`);
            level3Count = Number(level3Result[0]?.count || 0);
          }
        }
      }
    }

    const commResult = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
      .from(referralCommissions)
      .where(eq(referralCommissions.userId, userId));
    const totalCommission = parseFloat(commResult[0]?.total || "0");

    return { level1Count, level2Count, level3Count, totalCommission };
  }

  async getTeamStats(userId: number): Promise<TeamStats> {
    const [level1, level2, level3] = await this.getReferralLevels(userId);
    const totalCommission = await this.getUserCommissions(userId);
    const teamIds = Array.from(new Set([...level1, ...level2, ...level3].map(member => member.id)));
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    let totalDepositAmount = 0;
    let totalWithdrawalAmount = 0;
    let todayDepositAmount = 0;
    let todayWithdrawalAmount = 0;
    if (teamIds.length > 0) {
      const [depositTotals] = await db.select({
        total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`,
        today: sql<string>`COALESCE(SUM(CASE WHEN ${deposits.processedAt} >= ${todayStart} THEN ${deposits.amount} ELSE 0 END), 0)`,
      }).from(deposits).where(and(inArray(deposits.userId, teamIds), eq(deposits.status, "approved")));
      const [withdrawalTotals] = await db.select({
        total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`,
        today: sql<string>`COALESCE(SUM(CASE WHEN ${withdrawals.processedAt} >= ${todayStart} THEN ${withdrawals.amount} ELSE 0 END), 0)`,
      }).from(withdrawals).where(and(inArray(withdrawals.userId, teamIds), eq(withdrawals.status, "approved")));
      totalDepositAmount = Number(depositTotals.total);
      todayDepositAmount = Number(depositTotals.today);
      totalWithdrawalAmount = Number(withdrawalTotals.total);
      todayWithdrawalAmount = Number(withdrawalTotals.today);
    }

    const getCommissionByLevel = async (level: number) => {
      const result = await db.select({ total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)` })
        .from(referralCommissions)
        .where(and(eq(referralCommissions.userId, userId), eq(referralCommissions.level, level)));
      return parseFloat(result[0]?.total || "0");
    };

    const countInvested = async (userList: User[]) => {
      let count = 0;
      for (const u of userList) {
        if (u.hasActiveProduct) count++;
      }
      return count;
    };

    const countRecharged = async (userList: User[]) => {
      const userIds = userList.map(user => user.id);
      if (!userIds.length) return 0;
      const rows = await db.selectDistinct({ userId: deposits.userId }).from(deposits)
        .where(and(inArray(deposits.userId, userIds), eq(deposits.status, "approved")));
      return rows.length;
    };

    return {
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      demoMemberCount: [...level1, ...level2, ...level3].filter(member => member.phone.startsWith("DEMO-")).length,
      totalCommission,
      level1Commission: await getCommissionByLevel(1),
      level2Commission: await getCommissionByLevel(2),
      level3Commission: await getCommissionByLevel(3),
      level1Invested: await countInvested(level1),
      level2Invested: await countInvested(level2),
      level3Invested: await countInvested(level3),
      level1Recharged: await countRecharged(level1),
      totalDepositAmount,
      totalWithdrawalAmount,
      todayNewMembers: [...level1, ...level2, ...level3]
        .filter(member => !member.phone.startsWith("DEMO-") && member.createdAt >= todayStart).length,
      todayDepositAmount,
      todayWithdrawalAmount,
    };
  }

  async getDetailedTeam(userId: number): Promise<any> {
    const [level1, level2, level3] = await this.getReferralLevels(userId);
    const members = [...level1, ...level2, ...level3];
    const memberIds = Array.from(new Set(members.map(member => member.id)));
    const countryCodes = Array.from(new Set(members.map(member => member.country)));

    const [commissionRows, productRows, stakingRows, countryRows, depositRows, withdrawalRows] = await Promise.all([
      memberIds.length
        ? db.select({
            memberId: referralCommissions.fromUserId,
            total: sql<string>`COALESCE(SUM(${referralCommissions.amount}), 0)`,
          }).from(referralCommissions)
          .where(and(eq(referralCommissions.userId, userId), inArray(referralCommissions.fromUserId, memberIds)))
          .groupBy(referralCommissions.fromUserId)
        : [],
      memberIds.length
        ? db.select({
            memberId: userProducts.userId,
            productName: products.name,
            productPrice: products.price,
            isFree: products.isFree,
            sortOrder: products.sortOrder,
            purchaseDate: userProducts.purchaseDate,
            isActive: userProducts.isActive,
          }).from(userProducts)
          .innerJoin(products, eq(userProducts.productId, products.id))
          .where(inArray(userProducts.userId, memberIds))
        : [],
      memberIds.length
        ? db.select({ memberId: userStakings.userId, name: stakingProducts.name })
          .from(userStakings)
          .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
          .where(inArray(userStakings.userId, memberIds))
        : [],
      countryCodes.length
        ? db.select({ code: countries.code, phonePrefix: countries.phonePrefix })
          .from(countries).where(inArray(countries.code, countryCodes))
        : [],
      memberIds.length
        ? db.select({
            memberId: deposits.userId,
            total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`,
          }).from(deposits)
          .where(and(inArray(deposits.userId, memberIds), eq(deposits.status, "approved")))
          .groupBy(deposits.userId)
        : [],
      memberIds.length
        ? db.select({
            memberId: withdrawals.userId,
            total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`,
          }).from(withdrawals)
          .where(and(inArray(withdrawals.userId, memberIds), eq(withdrawals.status, "approved")))
          .groupBy(withdrawals.userId)
        : [],
    ]);
    const revenueByMember = new Map(commissionRows.map(row => [row.memberId, Number(row.total)]));
    const depositsByMember = new Map(depositRows.map(row => [row.memberId, Number(row.total)]));
    const withdrawalsByMember = new Map(withdrawalRows.map(row => [row.memberId, Number(row.total)]));
    const prefixByCountry = new Map(countryRows.map(row => [row.code, row.phonePrefix]));
    const productsByMember = new Map<number, Array<(typeof productRows)[number]>>();
    for (const row of productRows) {
      if (!productsByMember.has(row.memberId)) productsByMember.set(row.memberId, []);
      productsByMember.get(row.memberId)!.push(row);
    }
    const stakingVipByMember = new Map<number, number>();
    for (const row of stakingRows) {
      const level = Number(/^Produit\s*(\d+)$/i.exec(row.name)?.[1] || 0);
      stakingVipByMember.set(row.memberId, Math.max(stakingVipByMember.get(row.memberId) || 0, level));
    }

    const enrichUser = (user: User) => {
      const userProductsList = productsByMember.get(user.id) || [];
      const totalInvested = userProductsList.reduce((sum, p) => sum + p.productPrice, 0);
      const demoPreview = getDemoReferralPreview(user.phone);
      const prefix = prefixByCountry.get(user.country) || null;
      let digits = user.phone.replace(/\D/g, "");
      const countryPrefix = prefix?.replace(/\D/g, "") || "";
      const isInternational = user.phone.trim().startsWith("+") ||
        Boolean(countryPrefix && digits.startsWith(countryPrefix) && digits.length > countryPrefix.length + 5);
      if (isInternational && countryPrefix && digits.startsWith(countryPrefix)) {
        digits = digits.slice(countryPrefix.length);
      }
      const maskedPhone = demoPreview?.maskedPhone ||
        (digits.length > 5 ? `${digits.slice(0, 3)}***${digits.slice(-2)}` : "***");
      const whatsappNumber = demoPreview
        ? null
        : isInternational
          ? `${countryPrefix}${digits}`
          : countryPrefix
            ? `${countryPrefix}${digits}`
            : null;
      const vipLevel = Math.max(
        stakingVipByMember.get(user.id) || 0,
        ...userProductsList.filter(p => !p.isFree).map(p => {
          const namedLevel = Number(/^VIP\s*(\d+)$/i.exec(p.productName)?.[1] || 0);
          if (namedLevel > 0) return namedLevel;
          return Number.isInteger(p.sortOrder) && p.sortOrder >= 0 ? p.sortOrder + 1 : 0;
        }),
      );

      return {
        id: user.id,
        maskedPhone,
        whatsappNumber: whatsappNumber && /^\d{8,15}$/.test(whatsappNumber) ? whatsappNumber : null,
        isDemo: Boolean(demoPreview),
        demoPreview,
        totalInvested,
        totalReferralRevenue: revenueByMember.get(user.id) || 0,
        depositAmount: depositsByMember.get(user.id) || 0,
        withdrawalAmount: withdrawalsByMember.get(user.id) || 0,
        createdAt: user.createdAt,
        vipLevel: vipLevel || null,
      };
    };

    const level1Details = level1.map(enrichUser);
    const level2Details = level2.map(enrichUser);
    const level3Details = level3.map(enrichUser);

    return {
      level1: level1Details,
      level2: level2Details,
      level3: level3Details,
      totalLevel1Invested: level1Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel2Invested: level2Details.reduce((sum, u) => sum + u.totalInvested, 0),
      totalLevel3Invested: level3Details.reduce((sum, u) => sum + u.totalInvested, 0),
    };
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.isActive, true)).orderBy(tasks.sortOrder);
  }

  async getAdminTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.sortOrder, tasks.id);
  }

  async getAdminTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return task || undefined;
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<void> {
    const [existingTask] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!existingTask) throw new Error("Palier introuvable.");

    const [existingClaim] = await db.select({ id: userTasks.id })
      .from(userTasks)
      .where(eq(userTasks.taskId, id))
      .limit(1);
    if (existingClaim) {
      throw new Error("Ce palier a déjà été réclamé. Désactivez-le pour conserver l’historique des récompenses.");
    }

    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksWithStatus(userId: number): Promise<(Task & { isCompleted: boolean; canClaim: boolean; currentInvites: number })[]> {
    const allTasks = await this.getTasks();
    const user = await this.getUser(userId);
    if (!user) return [];

    const level1Refs = await this.getReferrals(userId, 1);
    const referralIds = level1Refs.map(ref => ref.id);
    const purchasedProducts = referralIds.length > 0
      ? await db.select({
          userId: userProducts.userId,
          isFree: products.isFree,
          assignedByAdmin: userProducts.assignedByAdmin,
        })
        .from(userProducts)
        .innerJoin(products, eq(userProducts.productId, products.id))
        .where(inArray(userProducts.userId, referralIds))
      : [];
    const currentInvites = countPurchasedReferrals(referralIds, purchasedProducts);

    const completedTasks = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
    const completedIds = new Set(completedTasks.map(t => t.taskId));

    return allTasks.map(task => ({
      ...task,
      isCompleted: completedIds.has(task.id),
      canClaim: !completedIds.has(task.id) && currentInvites >= task.requiredInvites,
      currentInvites: currentInvites,
    }));
  }

  async claimTask(userId: number, taskId: number): Promise<void> {
    const tasksStatus = await this.getTasksWithStatus(userId);
    const taskStatus = tasksStatus.find(t => t.id === taskId);

    if (!taskStatus) throw new Error("Tâche non trouvée");
    if (taskStatus.isCompleted) throw new Error("Tâche déjà réclamée");
    if (!taskStatus.canClaim) {
      throw new Error("Conditions non remplies : vos filleuls doivent avoir acheté un produit payant.");
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    await db.insert(userTasks).values({ userId, taskId });
    
    await this.creditWallet(userId, "earnings", taskStatus.reward, {
      type: "task_reward",
      amount: taskStatus.reward.toString(),
      description: `Récompense: ${taskStatus.name}`,
    });
  }

  // Transactions
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data as any).returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  // Settings
  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting?.value || null;
  }

  async getSettings(): Promise<Record<string, string>> {
    const allSettings = await db.select().from(platformSettings);
    const result: Record<string, string> = {};
    for (const s of allSettings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async setSetting(key: string, value: string, modifiedBy?: number): Promise<void> {
    const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    if (existing.length > 0) {
      await db.update(platformSettings).set({ value, modifiedBy, modifiedAt: new Date() }).where(eq(platformSettings.key, key));
    } else {
      await db.insert(platformSettings).values({ key, value, modifiedBy, modifiedAt: new Date() });
    }
  }

  // Admin
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer la date de réinitialisation des stats
    const statsResetDateStr = await this.getSetting("statsResetDate");
    const statsResetDate = statsResetDateStr ? new Date(statsResetDateStr) : new Date(0);
    
    const filterStart = startDate || new Date(0);
    const filterEnd = endDate || new Date();
    filterEnd.setHours(23, 59, 59, 999);

    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, statsResetDate));
    const [todayUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users).where(gte(users.createdAt, today));
    const [periodUsersResult] = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(and(gte(users.createdAt, filterStart), lte(users.createdAt, filterEnd)));
    
    const [totalDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, statsResetDate)));
    const [todayDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, today)));
    const [periodDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits).where(and(eq(deposits.status, "approved"), gte(deposits.createdAt, filterStart), lte(deposits.createdAt, filterEnd)));
    const [pendingDepositsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)`, count: sql<number>`count(*)` })
      .from(deposits).where(eq(deposits.status, "pending"));
    
    const [totalWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, statsResetDate)));
    const [todayWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, today)));
    const [periodWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals).where(and(eq(withdrawals.status, "approved"), gte(withdrawals.createdAt, filterStart), lte(withdrawals.createdAt, filterEnd)));
    const [pendingWithdrawalsResult] = await db.select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)`, count: sql<number>`count(*)` })
      .from(withdrawals).where(eq(withdrawals.status, "pending"));
    
    const [usersWithProductsResult] = await db.select({ count: sql<number>`count(DISTINCT ${userProducts.userId})` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    // Récupérer les valeurs baseline pour les compteurs cumulatifs
    const baselineBalance = parseFloat(await this.getSetting("baselineTotalBalance") || "0");
    const baselineEarnings = parseFloat(await this.getSetting("baselineTotalEarnings") || "0");
    const baselineCommissions = parseFloat(await this.getSetting("baselineTotalCommissions") || "0");
    
    const [totalBalanceResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalEarningsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` })
      .from(users);
    
    const [totalProductsResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userProducts).where(and(eq(userProducts.isActive, true), gte(userProducts.purchaseDate, statsResetDate)));
    
    const [totalCommissionsResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` })
      .from(transactions).where(eq(transactions.type, "commission"));

    // Soustraire les valeurs baseline pour obtenir les stats depuis la réinitialisation
    const adjustedBalance = Math.max(0, parseFloat(totalBalanceResult?.total || "0") - baselineBalance);
    const adjustedEarnings = Math.max(0, parseFloat(totalEarningsResult?.total || "0") - baselineEarnings);
    const adjustedCommissions = Math.max(0, parseFloat(totalCommissionsResult?.total || "0") - baselineCommissions);

    return {
      totalUsers: totalUsersResult?.count || 0,
      todayUsers: todayUsersResult?.count || 0,
      periodUsers: periodUsersResult?.count || 0,
      totalDeposits: parseFloat(totalDepositsResult?.total || "0"),
      todayDeposits: parseFloat(todayDepositsResult?.total || "0"),
      periodDeposits: parseFloat(periodDepositsResult?.total || "0"),
      pendingDeposits: parseFloat(pendingDepositsResult?.total || "0"),
      pendingDepositsCount: pendingDepositsResult?.count || 0,
      totalWithdrawals: parseFloat(totalWithdrawalsResult?.total || "0"),
      todayWithdrawals: parseFloat(todayWithdrawalsResult?.total || "0"),
      periodWithdrawals: parseFloat(periodWithdrawalsResult?.total || "0"),
      pendingWithdrawals: parseFloat(pendingWithdrawalsResult?.total || "0"),
      pendingWithdrawalsCount: pendingWithdrawalsResult?.count || 0,
      usersWithProducts: usersWithProductsResult?.count || 0,
      totalBalance: adjustedBalance,
      totalEarnings: adjustedEarnings,
      totalActiveProducts: totalProductsResult?.count || 0,
      totalCommissions: adjustedCommissions,
    };
  }

  async logAdminAction(adminId: number, action: string, targetUserId: number | null, details: string): Promise<void> {
    await db.insert(adminAuditLog).values({ adminId, action, targetUserId, details });
  }

  async resetStats(): Promise<void> {
    // Stocke la date de réinitialisation - les stats ne comptent que les données après cette date
    await this.setSetting("statsResetDate", new Date().toISOString());
    
    // Stocker les valeurs baseline pour les compteurs cumulatifs (solde et gains)
    const [currentBalance] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.balance} AS DECIMAL)), 0)` }).from(users);
    const [currentEarnings] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(${users.totalEarnings} AS DECIMAL)), 0)` }).from(users);
    const [currentCommissions] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(transactions).where(eq(transactions.type, "commission"));
    
    await this.setSetting("baselineTotalBalance", currentBalance?.total || "0");
    await this.setSetting("baselineTotalEarnings", currentEarnings?.total || "0");
    await this.setSetting("baselineTotalCommissions", currentCommissions?.total || "0");
  }

  // Gift Codes
  async getAllGiftCodes(): Promise<GiftCode[]> {
    return await db.select().from(giftCodes).orderBy(desc(giftCodes.createdAt));
  }

  async getGiftCodeByCode(code: string): Promise<GiftCode | undefined> {
    const [giftCode] = await db.select().from(giftCodes).where(
      sql`UPPER(${giftCodes.code}) = UPPER(${code})`
    );
    return giftCode || undefined;
  }

  async createGiftCode(data: { code: string; amount: string; maxUses: number; expiresAt: Date; createdBy: number }): Promise<GiftCode> {
    const [giftCode] = await db.insert(giftCodes).values(data).returning();
    return giftCode;
  }

  async deleteGiftCode(id: number): Promise<void> {
    await db.delete(giftCodes).where(eq(giftCodes.id, id));
  }

  async hasUserClaimedGiftCode(userId: number, giftCodeId: number): Promise<boolean> {
    const [claim] = await db.select().from(giftCodeClaims).where(
      and(eq(giftCodeClaims.userId, userId), eq(giftCodeClaims.giftCodeId, giftCodeId))
    );
    return !!claim;
  }

  async claimGiftCode(userId: number, giftCodeId: number, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
      if (!user) throw new Error("Utilisateur introuvable.");
      await tx.insert(giftCodeClaims).values({ userId, giftCodeId });
      await tx.update(giftCodes).set({
        currentUses: sql`${giftCodes.currentUses} + 1`
      }).where(eq(giftCodes.id, giftCodeId));
      await tx.update(users).set({
        balance: sql`${users.balance} + ${amount}`,
        earningsBalance: sql`${users.earningsBalance} + ${amount}`,
        totalEarnings: sql`${users.totalEarnings} + ${amount}`,
      }).where(eq(users.id, userId));
      const [createdTransaction] = await tx.insert(transactions).values({
        userId,
        type: "gift_code",
        amount: amount.toString(),
        description: `Bonus code cadeau`,
        walletImpact: JSON.stringify({
          depositDelta: 0,
          earningsDelta: amount,
          legacyDepositDelta: 0,
          legacyEarningsDelta: 0,
        }),
      }).returning();
      if (!user.walletActivatedAt) {
        await tx.update(users)
          .set({ walletActivatedAt: createdTransaction.createdAt })
          .where(and(eq(users.id, userId), isNull(users.walletActivatedAt)));
      }
    });
  }

  // Countries
  async getCountries(): Promise<Country[]> {
    return await db.select().from(countries);
  }

  async getActiveCountries(): Promise<Country[]> {
    return await db.select().from(countries).where(eq(countries.isActive, true));
  }

  async getCountry(id: number): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country || undefined;
  }

  async createCountry(data: Partial<Country>): Promise<Country> {
    const [country] = await db.insert(countries).values(data as any).returning();
    return country;
  }

  async updateCountry(id: number, data: Partial<Country>): Promise<Country> {
    const [country] = await db.update(countries).set(data as any).where(eq(countries.id, id)).returning();
    return country;
  }

  async deleteCountry(id: number): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }

  // Payment Numbers
  async getPaymentNumbers(): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers).orderBy(desc(paymentNumbers.createdAt));
  }

  async getPaymentNumber(id: number): Promise<PaymentNumber | undefined> {
    const [num] = await db.select().from(paymentNumbers).where(eq(paymentNumbers.id, id));
    return num || undefined;
  }

  async getPaymentNumbersByCountry(country: string): Promise<PaymentNumber[]> {
    return await db.select().from(paymentNumbers)
      .where(and(eq(paymentNumbers.country, country), eq(paymentNumbers.isActive, true)))
      .orderBy(paymentNumbers.operatorName);
  }

  async createPaymentNumber(data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.insert(paymentNumbers).values(data as any).returning();
    return num;
  }

  async updatePaymentNumber(id: number, data: Partial<PaymentNumber>): Promise<PaymentNumber> {
    const [num] = await db.update(paymentNumbers).set(data as any).where(eq(paymentNumbers.id, id)).returning();
    return num;
  }

  async deletePaymentNumber(id: number): Promise<void> {
    await db.delete(paymentNumbers).where(eq(paymentNumbers.id, id));
  }

  // Staking Products
  async getStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts).orderBy(stakingProducts.createdAt);
  }

  async getActiveStakingProducts(): Promise<StakingProduct[]> {
    return await db.select().from(stakingProducts)
      .where(eq(stakingProducts.isActive, true))
      .orderBy(stakingProducts.launchDate);
  }

  async getStakingProduct(id: number): Promise<StakingProduct | undefined> {
    const [sp] = await db.select().from(stakingProducts).where(eq(stakingProducts.id, id));
    return sp || undefined;
  }

  async createStakingProduct(data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.insert(stakingProducts).values(data as any).returning();
    return sp;
  }

  async updateStakingProduct(id: number, data: Partial<StakingProduct>): Promise<StakingProduct> {
    const [sp] = await db.update(stakingProducts).set(data as any).where(eq(stakingProducts.id, id)).returning();
    return sp;
  }

  async deleteStakingProduct(id: number): Promise<void> {
    await db.delete(stakingProducts).where(eq(stakingProducts.id, id));
  }

  async purchaseStaking(userId: number, stakingProductId: number): Promise<UserStaking> {
    const sp = await this.getStakingProduct(stakingProductId);
    if (!sp) throw new Error("Produit de staking introuvable");
    if (!sp.isActive) throw new Error("Produit de staking inactif");

    const now = new Date();
    if (sp.launchDate && new Date(sp.launchDate) > now) {
      throw new Error("Ce produit n'est pas encore disponible à l'achat");
    }

    const user = await this.getUser(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    // Check user has at least one active regular product
    const activeProds = await db.select().from(userProducts)
      .where(and(eq(userProducts.userId, userId), eq(userProducts.isActive, true)));
    if (activeProds.length === 0) {
      throw new Error("Vous devez posséder un produit actif avant d'accéder au Staking");
    }

    const releaseDate = new Date(now.getTime() + sp.lockDays * 24 * 60 * 60 * 1000);

    const { result: staking } = await this.spendWallet(userId, sp.price, "deposit-first", {
      type: "staking",
      description: `Staking: ${sp.name}`,
    }, {}, async (tx) => {
      const [created] = await tx.insert(userStakings).values({
        userId,
        stakingProductId,
        amountPaid: sp.price,
        returnAmount: sp.returnAmount,
        purchasedAt: now,
        releaseDate,
        status: "active",
      }).returning();
      return created as UserStaking;
    });

    if (!staking) throw new Error("Impossible de créer le staking.");
    return staking;
  }

  async getUserStakings(userId: number): Promise<(UserStaking & { product: StakingProduct })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .where(eq(userStakings.userId, userId))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product }));
  }

  async getAllUserStakings(): Promise<(UserStaking & { product: StakingProduct; user: User })[]> {
    const result = await db.select({ staking: userStakings, product: stakingProducts, user: users })
      .from(userStakings)
      .innerJoin(stakingProducts, eq(userStakings.stakingProductId, stakingProducts.id))
      .innerJoin(users, eq(userStakings.userId, users.id))
      .orderBy(desc(userStakings.purchasedAt));
    return result.map(r => ({ ...r.staking, product: r.product, user: r.user }));
  }

  async releaseMaturedStakings(): Promise<void> {
    const now = new Date();
    const matured = await db.select().from(userStakings)
      .where(and(eq(userStakings.status, "active"), lte(userStakings.releaseDate, now)));

    for (const staking of matured) {
      try {
        const user = await this.getUser(staking.userId);
        if (!user) continue;
        await this.creditWallet(staking.userId, "earnings", staking.returnAmount, {
          type: "staking_release",
          amount: staking.returnAmount.toString(),
          description: `Déblocage staking #${staking.id}`,
        });
        await db.update(userStakings)
          .set({ status: "released", releasedAt: now })
          .where(eq(userStakings.id, staking.id));
      } catch (e) {
        console.error("Error releasing staking:", staking.id, e);
      }
    }
  }
}

export const storage = new DatabaseStorage();
