"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

import { AccessState } from "./admin/AccessState";
import { AdminShell } from "./admin/AdminShell";
import { useAdminData } from "./admin/useAdminData";
import { RiderProfileModal } from "./admin/RiderProfileModal";

import { DashboardScreen } from "./admin/DashboardScreen";
import { RequestDashboardScreen } from "./admin/RequestDashboardScreen";
import { DeliveriesScreen } from "./admin/DeliveriesScreen";
import { RidersScreen } from "./admin/RidersScreen";
import { RiderVerificationScreen } from "./admin/RiderVerificationScreen";
import { RiderDocumentsScreen } from "./admin/RiderDocumentsScreen";
import { RiderPerformanceScreen } from "./admin/RiderPerformanceScreen";
import { RiderEarningsScreen } from "./admin/RiderEarningsScreen";
import { RiderWalletScreen } from "./admin/RiderWalletScreen";
import { RiderPayoutsScreen } from "./admin/RiderPayoutsScreen";
import { RiderComplaintsScreen } from "./admin/RiderComplaintsScreen";
import { RiderActivityScreen } from "./admin/RiderActivityScreen";
import { RiderSuspensionsScreen } from "./admin/RiderSuspensionsScreen";
import { UsersManagementScreen } from "./admin/UsersManagementScreen";
import { FinanceScreen } from "./admin/FinanceScreen";
import { RatingsScreen } from "./admin/RatingsScreen";
import { PromotionsScreen } from "./admin/PromotionsScreen";
import { PromoPerformanceScreen } from "./admin/PromoPerformanceScreen";
import { ZoneManagementScreen } from "./admin/ZoneManagementScreen";
import { SupportTicketsScreen } from "./admin/SupportTicketsScreen";
import { SosIncidentsScreen } from "./admin/SosIncidentsScreen";
import { ScheduledNotificationsScreen } from "./admin/ScheduledNotificationsScreen";
import { ReportsScreen } from "./admin/ReportsScreen";
import { AuditLogsScreen } from "./admin/AuditLogsScreen";
import { SettingsScreen } from "./admin/SettingsScreen";
import { PaymentMethodsScreen } from "./admin/PaymentMethodsScreen";
import { IntegrationsScreen } from "./admin/IntegrationsScreen";
import { TaxesComplianceScreen } from "./admin/TaxesComplianceScreen";
import { SettingsNotificationsScreen } from "./admin/SettingsNotificationsScreen";
import { AdminsScreen } from "./admin/AdminsScreen";
import EscalationRulesScreen from "./admin/EscalationRulesScreen";

import { parseNumber } from "./admin/utils";
import type { AdminConsoleScreen, RiderRecord } from "./admin/types";

export function AdminConsolePage({ screen }: { screen: AdminConsoleScreen }) {
  const { session, status, signOut: authSignOut } = useAuth();
  const token = session?.token ?? null;
  const isAdmin = session?.user?.role === "admin";

  const data = useAdminData(token, isAdmin);
  const [selectedRider, setSelectedRider] = useState<RiderRecord | null>(null);

  // ── access guard ────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <AccessState
        title="Loading admin workspace"
        body="Checking your admin session before opening live operations."
        actionLabel="Go to admin login"
        actionHref="/admin/login"
      />
    );
  }

  if (status !== "authenticated" || !isAdmin) {
    return (
      <AccessState
        title="Admin sign in required"
        body="Use an admin account to access the live operations console."
        actionLabel="Go to admin login"
        actionHref="/admin/login"
      />
    );
  }

  const dashboardToday = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "full"
  }).format(new Date());

  // ── screen renderer ─────────────────────────────────────────────────────────
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
          />
        );

      case "riders":
        return (
          <>
            <RidersScreen
              riders={data.riders}
              activeRiders={data.activeRiders}
              ridersWithCoords={data.ridersWithCoords}
              rideZoneSnapshot={data.rideZoneSnapshot}
              riderCitySnapshot={data.riderCitySnapshot}
              riderZoneSnapshot={data.riderZoneSnapshot}
              vehicleCount={data.vehicleCount}
              onboardingPipeline={{
                total: data.ridersTotal,
                signedUp: data.ridersTotal,
                hasVehicle: data.riders.filter(r => r.vehicle != null).length,
                hasZone: data.riders.filter(r => r.serviceZone != null).length,
                verified: data.riders.filter(r => r.user.accountStatus === "active").length,
                active: data.activeRiders.length
              }}
              onBulkApprove={(ids) => ids.forEach((id) => {
                const rider = data.riders.find((r) => r.id === id);
                if (rider) setSelectedRider(rider);
              })}
              onBulkSuspend={(ids) => ids.forEach((id) => {
                const rider = data.riders.find((r) => r.id === id);
                if (rider) setSelectedRider(rider);
              })}
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
            onRiderApproval={(id, action, reason) => data.riderApprovalMutation.mutate({ riderProfileId: id, action, reason })}
            isMutating={data.riderApprovalMutation.isPending}
            dataLoading={data.dataLoading}
          />
        );

      case "riderDocuments":
        return (
          <RiderDocumentsScreen
            riderDocumentRows={data.riderDocumentRows}
            riderDocumentStats={data.riderDocumentStats}
            dataLoading={data.dataLoading}
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
            isMutating={data.incidentReviewMutation.isPending}
            dataLoading={data.dataLoading}
          />
        );

      case "riderActivity":
        return (
          <RiderActivityScreen
            activityRows={data.riderFinancialRows}
            ridersWithCoords={data.ridersWithCoords}
            activeRidersCount={data.activeRiders.length}
            ridersWithCoordsCount={data.ridersWithCoords.length}
            activeTripsCount={data.activeRides.length}
            dataLoading={data.dataLoading}
          />
        );

      case "riderSuspensions":
        return (
          <RiderSuspensionsScreen
            suspendedRiders={data.suspendedRiders}
            totalRiders={data.ridersTotal}
            onSuspensionAction={(id, action, reason) => data.riderSuspensionMutation.mutate({ riderProfileId: id, action, reason })}
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
            passengersCount={data.passengersTotal}
            ridersCount={data.ridersTotal}
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
            postedWalletVolume={data.postedWalletTransactions.reduce((sum, t) => sum + Math.abs(parseNumber(t.amount)), 0)}
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
            />
            <div style={{ marginTop: 24 }}>
              <PromoPerformanceScreen
                rides={data.rides}
                adminCurrency={data.adminCurrency}
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
          />
        );

      case "sosIncidents":
        return (
          <SosIncidentsScreen
            incidents={data.incidents}
            onIncidentAction={(id, status) => data.incidentReviewMutation.mutate({ incidentId: id, status })}
            isMutating={data.incidentReviewMutation.isPending}
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
          />
        );

      case "reports":
        return (
          <ReportsScreen
            rides={data.rides}
            deliveries={data.deliveries}
            riders={data.riders}
            passengers={data.passengers}
            adminCurrency={data.adminCurrency}
          />
        );

      case "auditLogs":
        return (
          <AuditLogsScreen
            auditLogs={data.auditLogs}
            totalAdmins={data.adminAccounts.length}
          />
        );

      case "settings":
        return (
          <SettingsScreen
            zones={data.zones}
            adminAccounts={data.adminAccounts}
            adminRoleEntries={data.adminRoleEntries}
            adminModules={data.adminModules}
            adminCurrency={data.adminCurrency}
            auditLogs={data.auditLogs}
            dataLoading={data.dataLoading}
          />
        );

      case "paymentMethods":
        return <PaymentMethodsScreen dataLoading={data.dataLoading} />;

      case "integrations":
        return <IntegrationsScreen dataLoading={data.dataLoading} />;

      case "taxesCompliance":
        return <TaxesComplianceScreen dataLoading={data.dataLoading} />;

      case "settingsNotifications":
        return (
          <SettingsNotificationsScreen
            dataLoading={data.dataLoading}
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
            isCreating={data.createAdminMutation.isPending}
            isPromoting={data.promotePassengerMutation.isPending}
          />
        );

      default:
        return null;
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
