"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth";

import { AccessState } from "./admin/AccessState";
import { AdminShell } from "./admin/AdminShell";
import { useAdminData } from "./admin/useAdminData";
import { RiderProfileModal } from "./admin/RiderProfileModal";
import { AdminPageSkeleton } from "./admin/AdminSkeleton";

import { parseNumber } from "./admin/utils";
import type { AdminConsoleScreen, RiderRecord } from "./admin/types";

function screenFallback() {
  return <AdminPageSkeleton variant="table" kpis={4} rows={6} cols={5} />;
}

const DashboardScreen = dynamic(
  () => import("./admin/DashboardScreen").then((m) => m.DashboardScreen),
  { loading: screenFallback }
);
const LiveOperationsScreen = dynamic(
  () => import("./admin/LiveOperationsScreen").then((m) => m.LiveOperationsScreen),
  { loading: screenFallback }
);
const RequestDashboardScreen = dynamic(
  () => import("./admin/RequestDashboardScreen").then((m) => m.RequestDashboardScreen),
  { loading: screenFallback }
);
const DeliveriesScreen = dynamic(
  () => import("./admin/DeliveriesScreen").then((m) => m.DeliveriesScreen),
  { loading: screenFallback }
);
const RidersScreen = dynamic(
  () => import("./admin/RidersScreen").then((m) => m.RidersScreen),
  { loading: screenFallback }
);
const RiderVerificationScreen = dynamic(
  () => import("./admin/RiderVerificationScreen").then((m) => m.RiderVerificationScreen),
  { loading: screenFallback }
);
const RiderDocumentsScreen = dynamic(
  () => import("./admin/RiderDocumentsScreen").then((m) => m.RiderDocumentsScreen),
  { loading: screenFallback }
);
const RiderPerformanceScreen = dynamic(
  () => import("./admin/RiderPerformanceScreen").then((m) => m.RiderPerformanceScreen),
  { loading: screenFallback }
);
const RiderEarningsScreen = dynamic(
  () => import("./admin/RiderEarningsScreen").then((m) => m.RiderEarningsScreen),
  { loading: screenFallback }
);
const RiderWalletScreen = dynamic(
  () => import("./admin/RiderWalletScreen").then((m) => m.RiderWalletScreen),
  { loading: screenFallback }
);
const RiderPayoutsScreen = dynamic(
  () => import("./admin/RiderPayoutsScreen").then((m) => m.RiderPayoutsScreen),
  { loading: screenFallback }
);
const RiderComplaintsScreen = dynamic(
  () => import("./admin/RiderComplaintsScreen").then((m) => m.RiderComplaintsScreen),
  { loading: screenFallback }
);
const RiderActivityScreen = dynamic(
  () => import("./admin/RiderActivityScreen").then((m) => m.RiderActivityScreen),
  { loading: screenFallback }
);
const RiderSuspensionsScreen = dynamic(
  () => import("./admin/RiderSuspensionsScreen").then((m) => m.RiderSuspensionsScreen),
  { loading: screenFallback }
);
const UsersManagementScreen = dynamic(
  () => import("./admin/UsersManagementScreen").then((m) => m.UsersManagementScreen),
  { loading: screenFallback }
);
const FinanceScreen = dynamic(
  () => import("./admin/FinanceScreen").then((m) => m.FinanceScreen),
  { loading: screenFallback }
);
const RatingsScreen = dynamic(
  () => import("./admin/RatingsScreen").then((m) => m.RatingsScreen),
  { loading: screenFallback }
);
const PromotionsScreen = dynamic(
  () => import("./admin/PromotionsScreen").then((m) => m.PromotionsScreen),
  { loading: screenFallback }
);
const PromoPerformanceScreen = dynamic(
  () => import("./admin/PromoPerformanceScreen").then((m) => m.PromoPerformanceScreen),
  { loading: screenFallback }
);
const ZoneManagementScreen = dynamic(
  () => import("./admin/ZoneManagementScreen").then((m) => m.ZoneManagementScreen),
  { loading: screenFallback }
);
const SupportTicketsScreen = dynamic(
  () => import("./admin/SupportTicketsScreen").then((m) => m.SupportTicketsScreen),
  { loading: screenFallback }
);
const SosIncidentsScreen = dynamic(
  () => import("./admin/SosIncidentsScreen").then((m) => m.SosIncidentsScreen),
  { loading: screenFallback }
);
const ScheduledNotificationsScreen = dynamic(
  () => import("./admin/ScheduledNotificationsScreen").then((m) => m.ScheduledNotificationsScreen),
  { loading: screenFallback }
);
const ReportsScreen = dynamic(
  () => import("./admin/ReportsScreen").then((m) => m.ReportsScreen),
  { loading: screenFallback }
);
const AuditLogsScreen = dynamic(
  () => import("./admin/AuditLogsScreen").then((m) => m.AuditLogsScreen),
  { loading: screenFallback }
);
const SettingsScreen = dynamic(
  () => import("./admin/SettingsScreen").then((m) => m.SettingsScreen),
  { loading: screenFallback }
);
const CompanyProfileScreen = dynamic(
  () => import("./admin/CompanyProfileScreen").then((m) => m.CompanyProfileScreen),
  { loading: screenFallback }
);
const AccountSecurityScreen = dynamic(
  () => import("./admin/AccountSecurityScreen").then((m) => m.AccountSecurityScreen),
  { loading: screenFallback }
);
const NotificationSettingsScreen = dynamic(
  () => import("./admin/NotificationSettingsScreen").then((m) => m.NotificationSettingsScreen),
  { loading: screenFallback }
);
const PaymentMethodsScreen = dynamic(
  () => import("./admin/PaymentMethodsScreen").then((m) => m.PaymentMethodsScreen),
  { loading: screenFallback }
);
const IntegrationsScreen = dynamic(
  () => import("./admin/IntegrationsScreen").then((m) => m.IntegrationsScreen),
  { loading: screenFallback }
);
const TaxesComplianceScreen = dynamic(
  () => import("./admin/TaxesComplianceScreen").then((m) => m.TaxesComplianceScreen),
  { loading: screenFallback }
);
const SettingsNotificationsScreen = dynamic(
  () => import("./admin/SettingsNotificationsScreen").then((m) => m.SettingsNotificationsScreen),
  { loading: screenFallback }
);
const AdminsScreen = dynamic(
  () => import("./admin/AdminsScreen").then((m) => m.AdminsScreen),
  { loading: screenFallback }
);
const EscalationRulesScreen = dynamic(
  () => import("./admin/EscalationRulesScreen"),
  { loading: screenFallback }
);

export function AdminConsolePage({ screen }: { screen: AdminConsoleScreen }) {
  const { session, status, signOut: authSignOut } = useAuth();
  const token = session?.token ?? null;
  const isAdmin = session?.user?.role === "admin";

  const data = useAdminData(token, isAdmin, screen);
  const [selectedRider, setSelectedRider] = useState<RiderRecord | null>(null);

  if (status === "loading") {
    return (
      <AccessState
        title="Opening console"
        body="Verifying your OkadaGo admin session."
        actionLabel="Sign in"
        actionHref="/login"
        loading
      />
    );
  }

  if (status !== "authenticated" || !isAdmin) {
    return (
      <AccessState
        title="Sign in required"
        body="Use an OkadaGo admin account to manage Accra fleet, riders, and support."
        actionLabel="Sign in"
        actionHref="/login"
      />
    );
  }

  const dashboardToday = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "full"
  }).format(new Date());

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return (
          <DashboardScreen
            adminCurrency={data.adminCurrency}
            dashboardMetrics={data.dashboardMetrics}
            weeklyRideBuckets={data.weeklyRideBuckets}
            weeklyRideMax={data.weeklyRideMax}
            totalDashboardRevenue={data.totalDashboardRevenue}
            rideRevenuePercent={data.rideRevenuePercent}
            deliveryRevenuePercent={data.deliveryRevenuePercent}
            rideRevenue={data.rideRevenue}
            deliveryRevenue={data.deliveryRevenue}
            activeRiders={data.activeRiders}
            mapMarkers={data.mapMarkers}
            recentRideRequests={data.rides.slice(0, 5)}
            deliveries={data.deliveries}
            liveActivityItems={data.liveActivityItems}
            vehicleCount={data.vehicleCount}
            dashboardDateRange={data.dashboardDateRange}
            onDateRangeChange={data.setDashboardDateRange}
            dataLoading={data.dataLoading}
          />
        );

      case "liveOperations":
        return (
          <LiveOperationsScreen
            adminCurrency={data.adminCurrency}
            ridersWithCoords={data.ridersWithCoords}
            activeRiders={data.activeRiders}
            mapMarkers={data.mapMarkers}
            rides={data.rides}
            deliveries={data.deliveries}
            incidents={data.incidents}
            liveOnlineCount={data.liveOnlineCount}
            vehicleCount={data.vehicleCount}
            dataLoading={data.dataLoading}
          />
        );

      case "rides":
        return (
          <RequestDashboardScreen
            rides={data.rides}
            deliveries={data.deliveries}
            adminCurrency={data.adminCurrency}
            requestTab={data.requestTab}
            onTabChange={data.setRequestTab}
            requestStatusView={data.requestStatusView}
            onStatusViewChange={data.setRequestStatusView}
            visibleRequestCards={data.visibleRequestCards}
            visibleDeliveryRequestCards={data.visibleDeliveryRequestCards}
            activeRequestCounts={data.rideStatusGroups}
            requestPeakBuckets={data.requestPeakBuckets}
            requestPeakMax={data.requestPeakMax}
            onRideAction={(rideId, action) => data.rideRequestActionMutation.mutate({ rideId, action })}
            onDeliveryAction={(deliveryId, action) => data.deliveryRequestActionMutation.mutate({ deliveryId, action })}
            isMutating={data.rideRequestActionMutation.isPending || data.deliveryRequestActionMutation.isPending}
            dataLoading={data.dataLoading}
            ridesPage={data.ridesPage}
            ridesTotal={data.ridesTotal}
            ridesPageSize={data.ridesPageSize}
            onRidesPageChange={data.setRidesPage}
            deliveriesPage={data.deliveriesPage}
            deliveriesTotal={data.deliveriesTotal}
            deliveriesPageSize={data.deliveriesPageSize}
            onDeliveriesPageChange={data.setDeliveriesPage}
          />
        );

      case "deliveries":
        return (
          <DeliveriesScreen
            deliveries={data.deliveries}
            completedDeliveries={data.completedDeliveries}
            cancelledDeliveries={data.cancelledDeliveries}
            activeDeliveries={data.activeDeliveries}
            deliveryRevenue={data.deliveryRevenue}
            deliveryCommission={data.completedDeliveries.reduce((sum, d) => sum + parseNumber(d.platformCommission), 0)}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
            page={data.deliveriesPage}
            totalItems={data.deliveriesTotal}
            pageSize={data.deliveriesPageSize}
            onPageChange={data.setDeliveriesPage}
          />
        );

      case "riders":
        return (
          <>
            <RidersScreen
              riders={data.riders}
              ridersTotal={data.userStats?.riders.total ?? data.ridersTotal}
              activeRiders={data.activeRiders}
              ridersWithCoords={data.ridersWithCoords}
              mapMarkers={data.mapMarkers}
              rideZoneSnapshot={data.rideZoneSnapshot}
              riderCitySnapshot={data.riderCitySnapshot}
              riderZoneSnapshot={data.riderZoneSnapshot}
              vehicleCount={data.vehicleCount}
              onboardingPipeline={{
                total: data.userStats?.riders.total ?? data.ridersTotal,
                signedUp: data.userStats?.riders.total ?? data.ridersTotal,
                hasVehicle: data.riders.filter((r) => r.vehicle != null).length,
                hasZone: data.riders.filter((r) => r.serviceZone != null).length,
                verified:
                  data.userStats?.riders.verified ??
                  data.riders.filter((r) => (r.approvalStatus ?? "").toUpperCase() === "APPROVED").length,
                pending: data.userStats?.riders.pending,
                active: data.activeRiders.length
              }}
              onBulkApprove={(ids) =>
                ids.forEach((id) => {
                  const rider = data.riders.find((r) => r.id === id);
                  if (rider) setSelectedRider(rider);
                })
              }
              onBulkSuspend={(ids) =>
                ids.forEach((id) => {
                  const rider = data.riders.find((r) => r.id === id);
                  if (rider) setSelectedRider(rider);
                })
              }
              dataLoading={data.dataLoading}
              page={data.ridersPage}
              pageSize={data.listPageSize}
              onPageChange={data.setRidersPage}
            />
            {selectedRider && (
              <RiderProfileModal
                rider={selectedRider}
                rides={data.rides}
                walletTransactions={data.walletTransactions}
                payoutRequests={data.payoutRequests}
                ratings={data.ratings}
                adminCurrency={data.adminCurrency}
                onClose={() => setSelectedRider(null)}
              />
            )}
          </>
        );

      case "riderVerification":
        return (
          <RiderVerificationScreen
            riderVerificationRows={data.riderVerificationRows}
            riderVerificationStats={data.riderVerificationStats}
            onRiderApproval={(id, action, reason) =>
              data.riderApprovalMutation.mutate({ riderProfileId: id, action, reason })
            }
            onRequestInfo={(id, message) => data.requestRiderInfoMutation.mutate({ riderProfileId: id, message })}
            onExportCsv={() => void data.downloadServerCsv("riders")}
            isMutating={data.riderApprovalMutation.isPending || data.requestRiderInfoMutation.isPending}
            dataLoading={data.dataLoading}
          />
        );

      case "riderDocuments":
        return (
          <RiderDocumentsScreen
            riderDocumentRows={data.riderDocumentRows}
            riderDocumentStats={data.riderDocumentStats}
            onDocumentReview={(documentId, status, notes) =>
              data.documentReviewMutation.mutate({ documentId, status, notes })
            }
            isMutating={data.documentReviewMutation.isPending}
            dataLoading={data.dataLoading}
            page={data.documentsPage}
            totalItems={data.riderDocumentsTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setDocumentsPage}
          />
        );

      case "riderPerformance":
        return (
          <RiderPerformanceScreen
            topRiderPerformanceRows={data.riderFinancialRows}
            adminCurrency={data.adminCurrency}
            completedTrips={data.completedRides.length}
            activeTrips={data.activeRides.length}
            dataLoading={data.dataLoading}
          />
        );

      case "riderEarnings":
        return (
          <RiderEarningsScreen
            riderFinancialRows={data.riderFinancialRows}
            riderEarningBuckets={data.riderEarningBuckets}
            riderChartMax={data.riderChartMax}
            totalRiderGrossRevenue={data.totalRiderGrossRevenue}
            totalRiderEarnings={data.totalRiderEarnings}
            totalRiderCommission={data.totalRiderCommission}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
          />
        );

      case "riderWallet":
        return (
          <RiderWalletScreen
            riderWalletTransactions={data.riderWalletTransactions}
            riderWalletCredits={data.riderWalletCredits}
            riderWalletDebits={data.riderWalletDebits}
            riderWalletAvailableBalance={data.riderWalletAvailableBalance}
            riderWalletLockedBalance={data.riderWalletLockedBalance}
            riderWalletMovementTotal={data.riderWalletMovementTotal}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
          />
        );

      case "riderPayouts":
        return (
          <RiderPayoutsScreen
            riderPayoutRequests={data.payoutRequests}
            requestedRiderPayouts={data.requestedRiderPayouts}
            paidRiderPayouts={data.paidPayoutRequests}
            failedRiderPayouts={data.failedRiderPayouts}
            totalRiderPayoutValue={data.totalRiderPayoutValue}
            riderPayoutMethodSnapshot={data.riderPayoutMethodSnapshot}
            riderPayoutMethodTotal={data.riderPayoutMethodTotal}
            adminCurrency={data.adminCurrency}
            payoutRejectionReasons={data.payoutRejectionReasons}
            onRejectionReasonChange={(id, reason) =>
              data.setPayoutRejectionReasons((prev) => ({ ...prev, [id]: reason }))
            }
            onPayoutAction={(id, action, reason) =>
              data.payoutReviewMutation.mutate({ payoutRequestId: id, action, rejectionReason: reason })
            }
            isMutating={data.payoutReviewMutation.isPending}
            dataLoading={data.dataLoading}
            page={data.payoutPage}
            totalItems={data.payoutRequestsTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setPayoutPage}
          />
        );

      case "riderComplaints":
        return (
          <RiderComplaintsScreen
            riderIncidents={data.riderIncidents}
            riderComplaintOpen={data.riderComplaintOpen}
            riderComplaintInProgress={data.riderComplaintInProgress}
            riderComplaintResolved={data.riderComplaintResolved}
            onIncidentAction={(id, status) => data.incidentReviewMutation.mutate({ incidentId: id, status })}
            onIncidentAssign={(id, assignedToId) =>
              data.incidentAssignMutation.mutate({ incidentId: id, assignedToId })
            }
            adminAccounts={data.adminAccounts}
            token={token}
            isMutating={data.incidentReviewMutation.isPending || data.incidentAssignMutation.isPending}
            dataLoading={data.dataLoading}
          />
        );

      case "riderActivity":
        return (
          <RiderActivityScreen
            activityRows={data.riderFinancialRows}
            ridersWithCoords={data.ridersWithCoords}
            mapMarkers={data.mapMarkers}
            activeTripRiderNames={data.activeRides
              .map((ride) => ride.rider?.user.fullName)
              .filter((name): name is string => Boolean(name))}
            activeRidersCount={data.liveOnlineCount ?? data.activeRiders.length}
            ridersWithCoordsCount={
              data.badgeData.ridersWithCoordsCount ?? data.mapMarkers.length
            }
            activeTripsCount={data.activeRides.length}
            dataLoading={data.dataLoading}
          />
        );

      case "riderSuspensions":
        return (
          <RiderSuspensionsScreen
            suspendedRiders={data.suspendedRiders}
            totalRiders={data.ridersTotal}
            auditLogs={data.auditLogs}
            onSuspensionAction={(id, action, reason, durationDays) =>
              data.riderSuspensionMutation.mutate({ riderProfileId: id, action, reason, durationDays })
            }
            token={token}
            isMutating={data.riderSuspensionMutation.isPending}
            dataLoading={data.dataLoading}
          />
        );

      case "passengers":
        return (
          <UsersManagementScreen
            managedUsers={data.managedUsers}
            searchedManagedUsers={data.searchedManagedUsers}
            blockedUsers={data.blockedUsers}
            userLocationSnapshot={data.userLocationSnapshot}
            userLocationMax={data.userLocationMax}
            recentManagedUsers={data.recentManagedUsers}
            adminSearchTerm={data.adminSearchTerm}
            onSearchChange={data.setAdminSearchTerm}
            userTypeView={data.userTypeView}
            onTypeViewChange={data.setUserTypeView}
            passengersCount={data.userStats?.passengers.total ?? data.passengersTotal}
            ridersCount={data.userStats?.riders.total ?? data.ridersTotal}
            passengerPendingCount={data.userStats?.passengers.pending}
            passengerVerifiedCount={data.userStats?.passengers.verified}
            riderPendingCount={data.userStats?.riders.pending}
            riderVerifiedCount={data.userStats?.riders.verified}
            totalUsersCount={data.userStats?.totals.users}
            dataLoading={data.dataLoading || data.passengersPending || data.userStatsPending}
            page={data.passengersPage}
            totalItems={data.passengersTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setPassengersPage}
            onDeleteUser={(userId) => data.deleteUserMutation.mutate(userId)}
          />
        );

      case "payments":
        return (
          <FinanceScreen
            walletTransactions={data.filteredWalletTransactions}
            payoutRequests={data.filteredPayoutRequests}
            postedWalletTransactions={data.postedWalletTransactions}
            pendingWalletTransactions={data.pendingWalletTransactions}
            failedWalletTransactions={data.failedWalletTransactions}
            pendingPayoutRequests={data.pendingPayoutRequests}
            paidPayoutRequests={data.paidPayoutRequests}
            totalRevenue={data.totalRevenue}
            totalCommission={data.totalCommission}
            payoutOutflow={data.payoutOutflow}
            platformNetProfit={data.platformNetProfit}
            profitMargin={data.profitMargin}
            postedWalletVolume={
              data.financeSummary?.wallet.postedVolume ??
              data.postedWalletTransactions.reduce(
                (sum, t) => sum + Math.abs(parseNumber(t.amount)),
                0
              )
            }
            pendingPayoutValue={data.pendingPayoutValue}
            payoutHoldBalance={data.riderWalletLockedBalance}
            financeDailyBuckets={data.financeDailyBuckets}
            financeDailyMax={data.financeDailyMax}
            payoutDailyBuckets={data.payoutDailyBuckets}
            payoutDailyMax={data.payoutDailyMax}
            paymentMethodSnapshot={data.paymentMethodSnapshot}
            paymentMethodTotal={data.paymentMethodTotal}
            recentFinanceTransactions={data.walletTransactions.slice(0, 10)}
            transactionStatusFilter={data.transactionStatusFilter}
            transactionTypeFilter={data.transactionTypeFilter}
            payoutStatusFilter={data.payoutStatusFilter}
            onTransactionStatusChange={data.setTransactionStatusFilter}
            onTransactionTypeChange={data.setTransactionTypeFilter}
            onPayoutStatusChange={data.setPayoutStatusFilter}
            adminCurrency={data.adminCurrency}
            totalRideRevenue={data.totalRideRevenue}
            totalDeliveryRevenue={data.totalDeliveryRevenue}
            totalRideCommission={data.totalRideCommission}
            totalDeliveryCommission={data.totalDeliveryCommission}
            riderEarningsTotal={data.riderEarningsTotal}
            dataLoading={data.dataLoading}
            onPayoutAction={(id, action, reason) =>
              data.payoutReviewMutation.mutate({ payoutRequestId: id, action, rejectionReason: reason })
            }
            onServerExport={(entity) => void data.downloadServerCsv(entity)}
            isMutating={data.payoutReviewMutation.isPending}
            walletPage={data.walletPage}
            walletTotal={data.walletTxTotal}
            payoutPage={data.payoutPage}
            payoutTotal={data.payoutRequestsTotal}
            listPageSize={data.listPageSize}
            onWalletPageChange={data.setWalletPage}
            onPayoutPageChange={data.setPayoutPage}
          />
        );

      case "ratings":
        return (
          <RatingsScreen
            ratings={data.filteredRatings}
            incidents={data.incidents}
            riderRatingAverage={data.riderRatingAverage}
            riderRatingDistribution={data.riderRatingDistribution}
            ratingRiderFilter={data.ratingRiderFilter}
            ratingRideFilter={data.ratingRideFilter}
            ratingFromDateFilter={data.ratingFromDateFilter}
            ratingToDateFilter={data.ratingToDateFilter}
            onRiderFilterChange={data.setRatingRiderFilter}
            onRideFilterChange={data.setRatingRideFilter}
            onFromDateChange={data.setRatingFromDateFilter}
            onToDateChange={data.setRatingToDateFilter}
            dataLoading={data.dataLoading}
            page={data.ratingsPage}
            totalItems={data.ratingsTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setRatingsPage}
          />
        );

      case "promotions":
        return (
          <div>
            <PromotionsScreen
              promoAdjustedTrips={data.promoAdjustedTrips}
              topDiscountedRides={data.topDiscountedRides}
              promotionZoneSnapshot={data.promotionZoneSnapshot}
              promoSpend={data.promoSpend}
              referralSpend={data.referralSpend}
              adminCurrency={data.adminCurrency}
              dataLoading={data.dataLoading}
            />
            <div style={{ marginTop: 24 }}>
              <PromoPerformanceScreen
                rides={data.rides}
                adminCurrency={data.adminCurrency}
                dataLoading={data.dataLoading}
              />
            </div>
          </div>
        );

      case "zones":
        return (
          <ZoneManagementScreen
            zones={data.zones}
            ridersPerZone={data.ridersPerZone}
            ridesPerZone={data.ridesPerZone}
            adminCurrency={data.adminCurrency}
            onZoneUpdate={(zoneId, updates) => data.zoneUpdateMutation.mutate({ zoneId, updates })}
            isMutating={data.zoneUpdateMutation.isPending}
            dataLoading={data.zonesPending}
          />
        );

      case "supportTickets":
        return (
          <SupportTicketsScreen
            incidents={data.incidents}
            openTickets={data.openTickets}
            inProgressTickets={data.inProgressTickets}
            resolvedTickets={data.resolvedTickets}
            supportTickets={data.supportTickets}
            openSupportTickets={data.openSupportTicketRows}
            inProgressSupportTickets={data.inProgressSupportTicketRows}
            resolvedSupportTickets={data.resolvedSupportTicketRows}
            onIncidentAction={(id, status) => data.incidentReviewMutation.mutate({ incidentId: id, status })}
            isMutating={data.incidentReviewMutation.isPending}
            dataLoading={data.dataLoading || data.supportTicketsPending}
            page={data.ticketsPage}
            totalItems={data.supportTicketsTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setTicketsPage}
          />
        );

      case "sosIncidents":
        return (
          <SosIncidentsScreen
            incidents={data.incidents}
            onIncidentAction={(id, status) => data.incidentReviewMutation.mutate({ incidentId: id, status })}
            isMutating={data.incidentReviewMutation.isPending}
            dataLoading={data.dataLoading}
            page={data.incidentsPage}
            totalItems={data.incidentsTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setIncidentsPage}
          />
        );

      case "escalationRules":
        return (
          <EscalationRulesScreen
            rules={data.escalationRules}
            onToggleRule={(id, enabled) => data.toggleEscalationRuleMutation.mutate({ id, enabled })}
            onCreateRule={(rule) => data.createEscalationRuleMutation.mutate(rule)}
            isMutating={
              data.createEscalationRuleMutation.isPending || data.toggleEscalationRuleMutation.isPending
            }
            dataLoading={data.escalationRulesPending}
          />
        );

      case "notifications":
        return (
          <ScheduledNotificationsScreen
            notifications={data.scheduledBroadcasts}
            ridersCount={data.ridersTotal}
            passengersCount={data.passengersTotal}
            opsJobStatus={data.opsJobStatus}
            onSchedule={(notification) => data.scheduleBroadcastMutation.mutate(notification)}
            onCancel={(id) => data.cancelBroadcastMutation.mutate(id)}
            onRetry={(id) => data.retryBroadcastMutation.mutate(id)}
            isMutating={
              data.scheduleBroadcastMutation.isPending ||
              data.cancelBroadcastMutation.isPending ||
              data.retryBroadcastMutation.isPending
            }
            dataLoading={data.scheduledBroadcastsPending}
          />
        );

      case "reports":
        return (
          <ReportsScreen
            rides={data.rides}
            deliveries={data.deliveries}
            riders={data.riders}
            passengers={data.passengers}
            summaryDaily={data.financeSummary?.daily.map((day) => ({
              key: day.key,
              rides: day.rides,
              deliveries: day.deliveries,
              revenue: day.commission
            }))}
            totalCommission={data.financeSummary?.commission.total ?? data.totalCommission}
            adminCurrency={data.adminCurrency}
            ridersTotal={data.opsSummary?.riders.total ?? data.userStats?.riders.total ?? data.ridersTotal}
            passengersTotal={
              data.opsSummary?.passengers.total ??
              data.userStats?.passengers.total ??
              data.passengersTotal
            }
            riderPendingCount={data.opsSummary?.riders.pending ?? data.userStats?.riders.pending}
            riderVerifiedCount={data.opsSummary?.riders.verified ?? data.userStats?.riders.verified}
            passengerPendingCount={
              data.opsSummary?.passengers.pending ?? data.userStats?.passengers.pending
            }
            passengerVerifiedCount={
              data.opsSummary?.passengers.verified ?? data.userStats?.passengers.verified
            }
            onlineRidersCount={data.opsSummary?.riders.online}
            onServerExport={(entity) => void data.downloadServerCsv(entity)}
            dataLoading={data.dataLoading}
          />
        );

      case "auditLogs":
        return (
          <AuditLogsScreen
            auditLogs={data.auditLogs}
            totalAdmins={data.adminAccounts.length}
            onServerExport={() => void data.downloadServerCsv("audit-logs")}
            dataLoading={data.auditLogsPending}
            page={data.auditPage}
            totalItems={data.auditTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setAuditPage}
          />
        );

      case "settings":
        return (
          <SettingsScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
          />
        );

      case "companyProfile":
        return (
          <CompanyProfileScreen
            dataLoading={data.platformSettingsPending || data.userStatsPending || data.adminAccountsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
            adminCount={data.adminAccounts.length}
            riderCount={data.userStats?.riders.total ?? data.ridersTotal}
            passengerCount={data.userStats?.passengers.total ?? data.passengersTotal}
          />
        );

      case "accountSecurity":
        return (
          <AccountSecurityScreen
            dataLoading={data.platformSettingsPending}
            token={token}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
          />
        );

      case "notificationSettings":
        return (
          <NotificationSettingsScreen
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
          />
        );

      case "paymentMethods":
        return (
          <PaymentMethodsScreen
            dataLoading={data.walletTxPending || data.platformSettingsPending}
            adminCurrency={data.adminCurrency}
            walletTransactions={data.walletTransactions}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "integrations":
        return <IntegrationsScreen />;

      case "taxesCompliance":
        return (
          <TaxesComplianceScreen
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
          />
        );

      case "settingsNotifications":
        return (
          <SettingsNotificationsScreen
            dataLoading={data.scheduledBroadcastsPending || data.dataLoading}
            broadcasts={data.scheduledBroadcasts}
            openSosCount={data.openSosCount}
            recentIncidents={data.incidents.slice(0, 10)}
          />
        );

      case "admins":
        return (
          <AdminsScreen
            adminAccounts={data.adminAccounts}
            eligiblePassengers={data.eligiblePassengers}
            adminRoleEntries={data.adminRoleEntries}
            adminForm={data.adminForm}
            promoteForm={data.promoteForm}
            selectedPassenger={data.selectedPassenger}
            onAdminFormChange={data.handleAdminFormChange}
            onPromoteFormChange={data.handlePromoteFormChange}
            onCreateAdmin={() => data.createAdminMutation.mutate()}
            onPromotePassenger={() => data.promotePassengerMutation.mutate()}
            onDeleteAdmin={(userId) => data.deleteAdminMutation.mutate(userId)}
            isCreating={data.createAdminMutation.isPending}
            isPromoting={data.promotePassengerMutation.isPending}
            isDeleting={data.deleteAdminMutation.isPending}
            dataLoading={data.adminAccountsPending || data.passengersPending}
          />
        );

      default:
        return <DashboardScreen
          adminCurrency={data.adminCurrency}
          dashboardMetrics={data.dashboardMetrics}
          weeklyRideBuckets={data.weeklyRideBuckets}
          weeklyRideMax={data.weeklyRideMax}
          totalDashboardRevenue={data.totalDashboardRevenue}
          rideRevenuePercent={data.rideRevenuePercent}
          deliveryRevenuePercent={data.deliveryRevenuePercent}
          rideRevenue={data.rideRevenue}
          deliveryRevenue={data.deliveryRevenue}
          activeRiders={data.activeRiders}
          mapMarkers={data.mapMarkers}
          recentRideRequests={data.rides.slice(0, 5)}
          deliveries={data.deliveries}
          liveActivityItems={data.liveActivityItems}
          vehicleCount={data.vehicleCount}
          dashboardDateRange={data.dashboardDateRange}
          onDateRangeChange={data.setDashboardDateRange}
          dataLoading={data.dataLoading}
        />;
    }
  };

  return (
    <AdminShell
      screen={screen}
      onSignOut={authSignOut}
      badgeData={data.badgeData}
      screenHighlights={data.screenHighlights}
      dashboardToday={dashboardToday}
      userName={session?.user?.fullName ?? "Admin"}
      adminRoleEntries={data.adminRoleEntries}
    >
      {renderScreen()}
    </AdminShell>
  );
}
