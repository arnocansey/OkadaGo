"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth";

import { AccessState } from "./admin/AccessState";
import { AdminShell } from "./admin/AdminShell";
import { AdminErrorBoundary } from "./admin/ErrorBoundary";
import { useAdminData } from "./admin/useAdminData";
import { RiderProfileModal } from "./admin/RiderProfileModal";
import { AdminPageSkeleton } from "./admin/AdminSkeleton";
import { parseNumber } from "./admin/utils";
import type { AdminConsoleScreen, RiderRecord } from "./admin/types";
import { hasScreenAccess } from "@/lib/permissions";
import { AccessDeniedScreen } from "./admin/AccessDeniedScreen";

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
const RidesScreen = dynamic(
  () => import("./admin/RidesScreen").then((m) => m.RidesScreen),
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
const PricingManagementScreen = dynamic(
  () => import("./admin/PricingManagementScreen").then((m) => m.PricingManagementScreen),
  { loading: screenFallback }
);
const DynamicPricingScreen = dynamic(
  () => import("./admin/DynamicPricingScreen").then((m) => m.DynamicPricingScreen),
  { loading: screenFallback }
);
const PromotionsManagementScreen = dynamic(
  () => import("./admin/PromotionsManagementScreen").then((m) => m.PromotionsManagementScreen),
  { loading: screenFallback }
);
const FinanceDashboardScreen = dynamic(
  () => import("./admin/FinanceDashboardScreen").then((m) => m.FinanceDashboardScreen),
  { loading: screenFallback }
);
const RiderPayoutDashboardScreen = dynamic(
  () => import("./admin/RiderPayoutDashboardScreen").then((m) => m.RiderPayoutDashboardScreen),
  { loading: screenFallback }
);
const RefundManagementScreen = dynamic(
  () => import("./admin/RefundManagementScreen").then((m) => m.RefundManagementScreen),
  { loading: screenFallback }
);
const SupportTicketsScreen = dynamic(
  () => import("./admin/SupportTicketsScreen").then((m) => m.SupportTicketsScreen),
  { loading: screenFallback }
);
const SupportCenterScreen = dynamic(
  () => import("./admin/SupportCenterScreen").then((m) => m.SupportCenterScreen),
  { loading: screenFallback }
);
const SosIncidentsScreen = dynamic(
  () => import("./admin/SosIncidentsScreen").then((m) => m.SosIncidentsScreen),
  { loading: screenFallback }
);
const AnalyticsDashboardScreen = dynamic(
  () => import("./admin/AnalyticsDashboardScreen").then((m) => m.AnalyticsDashboardScreen),
  { loading: screenFallback }
);
const SafetyIncidentCenter = dynamic(
  () => import("./admin/SafetyIncidentCenter").then((m) => m.SafetyIncidentCenter),
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
const UnauthorizedUsersScreen = dynamic(
  () => import("./admin/UnauthorizedUsersScreen").then((m) => m.UnauthorizedUsersScreen),
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
const DeliveriesManagementScreen = dynamic(
  () => import("./admin/DeliveriesManagementScreen").then((m) => m.DeliveriesManagementScreen),
  { loading: screenFallback }
);
const RidersManagementScreen = dynamic(
  () => import("./admin/RidersManagementScreen").then((m) => m.RidersManagementScreen),
  { loading: screenFallback }
);
const SettingsManagementScreen = dynamic(
  () => import("./admin/SettingsManagementScreen").then((m) => m.SettingsManagementScreen),
  { loading: screenFallback }
);
const RiderVerificationCenter = dynamic(
  () => import("./admin/RiderVerificationCenter").then((m) => m.RiderVerificationCenter),
  { loading: screenFallback }
);
const PassengersManagementScreen = dynamic(
  () => import("./admin/PassengersManagementScreen").then((m) => m.PassengersManagementScreen),
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
const TransactionsScreen = dynamic(
  () => import("./admin/TransactionsScreen").then((m) => m.TransactionsScreen),
  { loading: screenFallback }
);
const ReferralsScreen = dynamic(
  () => import("./admin/ReferralsScreen").then((m) => m.ReferralsScreen),
  { loading: screenFallback }
);
const GoPointsScreen = dynamic(
  () => import("./admin/GoPointsScreen").then((m) => m.GoPointsScreen),
  { loading: screenFallback }
);
const MessageTemplatesScreen = dynamic(
  () => import("./admin/MessageTemplatesScreen").then((m) => m.MessageTemplatesScreen),
  { loading: screenFallback }
);
const SafetyCenterDashboard = dynamic(
  () => import("./admin/SafetyCenterDashboard").then((m) => m.SafetyCenterDashboard),
  { loading: screenFallback }
);
const RolesPermissionsScreen = dynamic(
  () => import("./admin/RolesPermissionsScreen").then((m) => m.RolesPermissionsScreen),
  { loading: screenFallback }
);
const RiderAssignmentScreen = dynamic(
  () => import("./admin/RiderAssignmentScreen").then((m) => m.RiderAssignmentScreen),
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
    if (!hasScreenAccess(session?.user, screen)) {
      return (
        <AccessDeniedScreen
          user={session?.user}
          screenTitle={screen}
        />
      );
    }

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
          <RidesScreen
            rides={data.rides}
            adminCurrency={data.adminCurrency}
            ridesTotal={data.ridesTotal}
            ridesPage={data.ridesPage}
            ridesPageSize={data.ridesPageSize}
            onRidesPageChange={data.setRidesPage}
            dataLoading={data.dataLoading}
          />
        );

      case "deliveries":
        return (
          <DeliveriesManagementScreen
            deliveries={data.deliveries}
            completedDeliveries={data.completedDeliveries}
            cancelledDeliveries={data.cancelledDeliveries}
            activeDeliveries={data.activeDeliveries}
            deliveryRevenue={data.deliveryRevenue}
            adminCurrency={data.adminCurrency}
            deliveriesTotal={data.deliveriesTotal}
            deliveriesPage={data.deliveriesPage}
            deliveriesPageSize={data.deliveriesPageSize}
            onDeliveriesPageChange={data.setDeliveriesPage}
            dataLoading={data.dataLoading}
          />
        );

      case "riders":
        return (
          <RidersManagementScreen
            riders={data.riders}
            ridersTotal={data.userStats?.riders.total ?? data.ridersTotal}
            activeRiders={data.activeRiders}
            suspendedRiders={data.suspendedRiders}
            userStats={data.userStats}
            ridersPage={data.ridersPage}
            listPageSize={data.listPageSize}
            onRidersPageChange={data.setRidersPage}
            dataLoading={data.dataLoading}
          />
        );

      case "riderVerification":
        return (
          <RiderVerificationCenter
            riderVerificationRows={data.riderVerificationRows}
            riderVerificationStats={data.riderVerificationStats}
            riderDocuments={data.riderDocuments}
            onRiderApproval={(id, action, reason) =>
              data.riderApprovalMutation.mutate({ riderProfileId: id, action, reason })
            }
            onRequestInfo={(id, message) => data.requestRiderInfoMutation.mutate({ riderProfileId: id, message })}
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
          <RiderPayoutDashboardScreen
            payoutRequests={data.payoutRequests}
            payoutRequestsTotal={data.payoutRequestsTotal}
            payoutStatusFilter={data.payoutStatusFilter}
            onPayoutStatusChange={data.setPayoutStatusFilter}
            payoutPage={data.payoutPage}
            payoutTotal={data.payoutRequestsTotal}
            listPageSize={data.listPageSize}
            onPayoutPageChange={data.setPayoutPage}
            pendingPayoutValue={data.pendingPayoutValue}
            payoutOutflow={data.payoutOutflow}
            totalRiderPayoutValue={data.totalRiderPayoutValue}
            failedRiderPayouts={data.failedRiderPayouts}
            onPayoutAction={(id, action, reason) =>
              data.payoutReviewMutation.mutate({ payoutRequestId: id, action, rejectionReason: reason })
            }
            onServerExport={(entity) => void data.downloadServerCsv(entity)}
            isMutating={data.payoutReviewMutation.isPending}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
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
          <PassengersManagementScreen
            passengers={data.passengers}
            passengersTotal={data.userStats?.passengers.total ?? data.passengersTotal}
            rides={data.rides}
            userStats={data.userStats}
            passengersPage={data.passengersPage}
            listPageSize={data.listPageSize}
            onPassengersPageChange={data.setPassengersPage}
            dataLoading={data.dataLoading || data.passengersPending}
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
          <PromotionsManagementScreen
            promoCodes={data.promoCodes}
            promoAdjustedTrips={data.promoAdjustedTrips}
            promoSpend={data.promoSpend}
            referralSpend={data.referralSpend}
            adminCurrency={data.adminCurrency}
            onCreatePromo={(input) => data.createPromoMutation.mutate(input)}
            onUpdatePromo={(id, updates) => data.updatePromoMutation.mutate({ id, updates })}
            isMutating={data.createPromoMutation.isPending || data.updatePromoMutation.isPending}
            dataLoading={data.dataLoading || data.promoCodesPending}
          />
        );

      case "promoManagement":
        return (
          <PromotionsManagementScreen
            promoCodes={data.promoCodes}
            promoAdjustedTrips={data.promoAdjustedTrips}
            promoSpend={data.promoSpend}
            referralSpend={data.referralSpend}
            adminCurrency={data.adminCurrency}
            onCreatePromo={(input) => data.createPromoMutation.mutate(input)}
            onUpdatePromo={(id, updates) => data.updatePromoMutation.mutate({ id, updates })}
            isMutating={data.createPromoMutation.isPending || data.updatePromoMutation.isPending}
            dataLoading={data.dataLoading || data.promoCodesPending}
          />
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

      case "pricing":
        return (
          <PricingManagementScreen
            zones={data.zones}
            ridersPerZone={data.ridersPerZone}
            ridesPerZone={data.ridesPerZone}
            adminCurrency={data.adminCurrency}
            onSavePricing={(zoneId, updates) => data.zoneUpdateMutation.mutate({ zoneId, updates })}
            isMutating={data.zoneUpdateMutation.isPending}
            dataLoading={data.zonesPending}
          />
        );

      case "dynamicPricing":
        return (
          <DynamicPricingScreen
            zones={data.zones}
            rides={data.rides}
            ridersPerZone={data.ridersPerZone}
            ridesPerZone={data.ridesPerZone}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading || data.zonesPending}
          />
        );

      case "supportTickets":
        return (
          <SupportCenterScreen
            supportTickets={data.supportTickets}
            openSupportTickets={data.openSupportTicketRows}
            inProgressSupportTickets={data.inProgressSupportTicketRows}
            resolvedSupportTickets={data.resolvedSupportTicketRows}
            rides={data.rides}
            deliveries={data.deliveries}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading || data.supportTicketsPending}
            ticketMessages={data.ticketMessages}
            ticketMessagesLoading={data.ticketMessagesPending}
            selectedTicketId={data.selectedTicketId}
            onSelectTicket={data.setSelectedTicketId}
            onSendMessage={(ticketId, body) => data.sendTicketMessageMutation.mutate({ ticketId, body })}
            isSendingMessage={data.sendTicketMessageMutation.isPending}
            onTicketAction={(id, action, value) => {
              data.incidentReviewMutation.mutate({ incidentId: id, status: action === "resolve" ? "RESOLVED" : action === "close" ? "CLOSED" : action === "escalate" ? "UNDER_REVIEW" : "ACTIONED" });
            }}
          />
        );

      case "sosIncidents":
        return (
          <SafetyIncidentCenter
            incidents={data.incidents}
            incidentsTotal={data.incidentsTotal}
            adminAccounts={data.adminAccounts}
            rides={data.rides}
            onIncidentAction={(id, status) => data.incidentReviewMutation.mutate({ incidentId: id, status })}
            onIncidentAssign={(id, assignedToId) => data.incidentAssignMutation.mutate({ incidentId: id, assignedToId })}
            isMutating={data.incidentReviewMutation.isPending || data.incidentAssignMutation.isPending}
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

      case "analytics":
        return (
          <AnalyticsDashboardScreen
            rides={data.rides}
            deliveries={data.deliveries}
            riders={data.riders}
            passengers={data.passengers}
            zones={data.zones}
            financeSummary={data.financeSummary ?? null}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
            dashboardDateRange={data.dashboardDateRange}
            onDateRangeChange={data.setDashboardDateRange}
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
            accessLogs={data.accessLogs}
            totalAdmins={data.adminAccounts.length}
            onServerExport={() => void data.downloadServerCsv("audit-logs")}
            dataLoading={data.auditLogsPending || data.accessLogsPending}
            page={data.auditPage}
            totalItems={data.auditTotal}
            pageSize={data.listPageSize}
            onPageChange={data.setAuditPage}
            onRevokeSession={(id) => data.revokeSessionMutation.mutate(id)}
            isRevokingSession={data.revokeSessionMutation.isPending}
          />
        );

      case "unauthorizedUsers":
        return (
          <UnauthorizedUsersScreen
            unauthorizedUsers={data.unauthorizedUsers}
            totalUsers={data.unauthorizedUsersTotal}
            dataLoading={data.unauthorizedUsersPending}
            onDeleteUser={(userId, reason) => data.deleteUserMutation.mutate({ userId, reason })}
            isDeletingUser={data.deleteUserMutation.isPending}
            page={data.unauthorizedUsersPage}
            totalItems={data.unauthorizedUsersTotal}
            pageSize={20}
            onPageChange={data.setUnauthorizedUsersPage}
          />
        );

      case "settings":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "companyProfile":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "accountSecurity":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "notificationSettings":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "paymentMethods":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "integrations":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
          />
        );

      case "taxesCompliance":
        return (
          <SettingsManagementScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.platformSettingsPending}
            platformSettings={data.platformSettings}
            onSaveSettings={(settings) => data.saveSettingsMutation.mutate(settings)}
            settingsSaving={data.saveSettingsMutation.isPending}
            token={token}
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

      case "revenue":
        return (
          <FinanceDashboardScreen
            financeSummary={data.financeSummary ?? null}
            walletTransactions={data.walletTransactions}
            rides={data.rides}
            deliveries={data.deliveries}
            pendingPayoutValue={data.pendingPayoutValue}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
            onServerExport={(entity) => void data.downloadServerCsv(entity)}
          />
        );

      case "transactions":
        return (
          <TransactionsScreen
            walletTransactions={data.walletTransactions}
            rides={data.rides}
            deliveries={data.deliveries}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
          />
        );

      case "payouts":
        return (
          <RiderPayoutDashboardScreen
            payoutRequests={data.payoutRequests}
            payoutRequestsTotal={data.payoutRequestsTotal}
            payoutStatusFilter={data.payoutStatusFilter}
            onPayoutStatusChange={data.setPayoutStatusFilter}
            payoutPage={data.payoutPage}
            payoutTotal={data.payoutRequestsTotal}
            listPageSize={20}
            onPayoutPageChange={data.setPayoutPage}
            pendingPayoutValue={data.pendingPayoutValue}
            payoutOutflow={data.payoutOutflow}
            totalRiderPayoutValue={data.totalRiderPayoutValue}
            failedRiderPayouts={data.failedRiderPayouts}
            onPayoutAction={(id, action, reason) => data.payoutReviewMutation.mutate({ payoutRequestId: id, action, rejectionReason: reason })}
            onServerExport={(entity) => void data.downloadServerCsv(entity)}
            isMutating={data.payoutReviewMutation.isPending}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
          />
        );

      case "wallet":
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

      case "referrals":
        return (
          <ReferralsScreen
            referralSpend={data.referralSpend}
            promoCodes={data.promoCodes}
            promoAdjustedTrips={data.promoAdjustedTrips}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
          />
        );

      case "goPoints":
        return (
          <GoPointsScreen
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
            goPointRules={data.goPointRules}
            goPointBalances={data.goPointBalances}
            goPointLedger={data.goPointLedger}
            goPointRedemptions={data.goPointRedemptions}
            onCreateRule={(input) => data.createGoPointRuleMutation.mutate(input)}
            onUpdateRule={(id, updates) => data.updateGoPointRuleMutation.mutate({ id, updates })}
            onCreateRedemption={(input) => data.createGoPointRedemptionMutation.mutate(input)}
            isMutating={data.createGoPointRuleMutation.isPending || data.updateGoPointRuleMutation.isPending}
          />
        );

      case "messageTemplates":
        return (
          <MessageTemplatesScreen
            dataLoading={data.dataLoading}
            messageTemplates={data.messageTemplates}
            onCreateTemplate={(input) => data.createMessageTemplateMutation.mutate(input)}
            onUpdateTemplate={(id, updates) => data.updateMessageTemplateMutation.mutate({ id, updates })}
            onDeleteTemplate={(id) => data.deleteMessageTemplateMutation.mutate(id)}
            isMutating={data.createMessageTemplateMutation.isPending || data.updateMessageTemplateMutation.isPending || data.deleteMessageTemplateMutation.isPending}
          />
        );

      case "safetyCenter":
        return (
          <SafetyCenterDashboard
            incidents={data.incidents}
            escalationRules={data.escalationRules}
            riders={data.riders}
            dataLoading={data.dataLoading}
          />
        );

      case "rolesPermissions":
        return (
          <RolesPermissionsScreen
            adminAccounts={data.adminAccounts}
            adminRoleEntries={data.adminRoleEntries}
            dataLoading={data.adminAccountsPending}
            onDeleteAdmin={(userId) => data.deleteAdminMutation.mutate(userId)}
            onReassignAdmin={() => {}} /* rolesPermissions handles its own toast */
          />
        );

      case "refunds":
        return (
          <RefundManagementScreen
            walletTransactions={data.walletTransactions}
            rides={data.rides}
            deliveries={data.deliveries}
            adminCurrency={data.adminCurrency}
            dataLoading={data.dataLoading}
            onServerExport={(entity) => void data.downloadServerCsv(entity)}
          />
        );

      case "riderAssignment":
        return (
          <RiderAssignmentScreen
            activeRides={data.assignmentActiveRides}
            activeRidesPending={data.assignmentActiveRidesPending}
            selectedAssignmentRideId={data.selectedAssignmentRideId}
            setSelectedAssignmentRideId={data.setSelectedAssignmentRideId}
            availableRidersData={data.availableRidersData}
            availableRidersPending={data.availableRidersPending}
            assignRiderMutation={data.assignRiderMutation}
            reassignRiderMutation={data.reassignRiderMutation}
            unassignRiderMutation={data.unassignRiderMutation}
            autoAssignMutation={data.autoAssignMutation}
            assignmentStats={data.assignmentStats}
            assignmentStatsPending={data.assignmentStatsPending}
            assignmentRules={data.assignmentRules}
            assignmentRulesPending={data.assignmentRulesPending}
            createAssignmentRuleMutation={data.createAssignmentRuleMutation}
            updateAssignmentRuleMutation={data.updateAssignmentRuleMutation}
            deleteAssignmentRuleMutation={data.deleteAssignmentRuleMutation}
            zones={data.zones}
            allAssignmentHistory={data.allAssignmentHistory}
            allAssignmentHistoryPending={data.allAssignmentHistoryPending}
            refetchAllAssignmentHistory={data.refetchAllAssignmentHistory}
            autoAssignEnabled={data.autoAssignEnabled}
            setAutoAssignEnabled={data.setAutoAssignEnabled}
            mapMarkers={data.mapMarkers}
            adminCurrency={data.adminCurrency}
            token={data.token ?? ""}
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
      currentUser={session?.user}
      adminRoleEntries={data.adminRoleEntries}
    >
      <AdminErrorBoundary>
        {renderScreen()}
      </AdminErrorBoundary>
    </AdminShell>
  );
}
