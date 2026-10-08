import { StyleSheet, View } from "react-native";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";

export type SkeletonVariant =
  | "activity"
  | "activityDetail"
  | "app"
  | "brand"
  | "cover"
  | "coverWithActions"
  | "coverDetail"
  | "dashboard"
  | "device"
  | "deviceWithoutBrand"
  | "deviceDetail";

function Block({
  height,
  width = "100%",
  pill = false,
}: {
  height: number;
  width?: number | `${number}%`;
  pill?: boolean;
}) {
  return (
    <View style={[styles.block, { height, width }, pill && styles.pill]} />
  );
}

function CoverSkeleton({ withActions = false }: { withActions?: boolean }) {
  return (
    <View style={styles.coverCard}>
      <View style={styles.coverTop}>
        <View style={styles.coverImage} />
        <View style={styles.copy}>
          <Block height={10} width="30%" />
          <Block height={16} width="58%" />
        </View>
        <Block height={28} width={28} />
      </View>
      <View style={styles.coverMeta}>
        <Block height={29} width={86} pill />
      </View>
      {withActions ? (
        <View style={styles.actions}>
          <Block height={46} width="48%" pill />
          <Block height={46} width="48%" pill />
        </View>
      ) : null}
    </View>
  );
}

function DeviceSkeleton({ showBrand = true }: { showBrand?: boolean }) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceImage} />
      <View style={styles.copy}>
        {showBrand ? <Block height={11} width="28%" /> : null}
        <Block height={17} width="58%" />
        <Block height={13} width="74%" />
      </View>
      <View style={styles.deviceCount}>
        <Block height={18} width={20} />
        <Block height={9} width={30} />
      </View>
    </View>
  );
}

function BrandSkeleton() {
  return (
    <View style={styles.brandCard}>
      <View style={styles.brandLogo} />
      <View style={styles.copy}>
        <Block height={17} width="42%" />
        <Block height={13} width="68%" />
      </View>
      <View style={styles.modelCount}>
        <Block height={15} width={18} />
        <Block height={9} width={32} />
      </View>
    </View>
  );
}

function ActivitySkeleton({ last = false }: { last?: boolean }) {
  return (
    <View style={[styles.activityRow, !last && styles.activityBorder]}>
      <View style={styles.activityIcon} />
      <View style={styles.copy}>
        <Block height={16} width="56%" />
        <Block height={13} width="78%" />
        <View style={styles.activityMeta}>
          <Block height={22} width={58} pill />
          <Block height={12} width="42%" />
        </View>
        <Block height={12} width="70%" />
      </View>
      <View style={styles.activityMovement}>
        <Block height={20} width={28} />
        <Block height={12} width={38} />
      </View>
    </View>
  );
}

function CoverHistorySkeleton() {
  return (
    <View style={styles.coverHistory}>
      <View style={styles.historyDot} />
      <View style={styles.copy}>
        <Block height={15} width="38%" />
        <Block height={13} width="82%" />
        <Block height={12} width="56%" />
      </View>
      <Block height={18} width={26} />
    </View>
  );
}

function DashboardSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.metrics}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.metric}>
            <Block height={27} width="46%" />
            <Block height={12} width="76%" />
          </View>
        ))}
      </View>
      <View style={styles.salesCard}>
        <View style={styles.salesHead}>
          <View style={styles.copy}>
            <Block height={18} width="45%" />
            <Block height={13} width="72%" />
          </View>
          <Block height={27} width={28} />
        </View>
        <View style={styles.chart}>
          {Array.from({ length: 7 }, (_, item) => (
            <View key={item} style={styles.barGroup}>
              <Block height={12} width={10} />
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${[38, 64, 48, 78, 32, 56, 42][item]}%` },
                  ]}
                />
              </View>
              <Block height={10} width={16} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.sectionHead}>
        <Block height={22} width="38%" />
        <Block height={12} width={70} />
      </View>
      <CoverSkeleton />
      <CoverSkeleton />
      <View style={styles.sectionHead}>
        <Block height={22} width="34%" />
        <Block height={13} width={48} />
      </View>
      <View style={styles.dashboardActivity}>
        <View style={styles.dashboardDot} />
        <View style={styles.copy}>
          <Block height={15} width="52%" />
          <Block height={12} width="82%" />
        </View>
        <Block height={18} width={26} />
      </View>
      <View style={styles.dashboardActivity}>
        <View style={styles.dashboardDot} />
        <View style={styles.copy}>
          <Block height={15} width="45%" />
          <Block height={12} width="72%" />
        </View>
        <Block height={18} width={26} />
      </View>
    </View>
  );
}

function CoverDetailSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.stockCard}>
        <View style={styles.copy}>
          <Block height={12} width={104} />
          <Block height={28} width={88} />
        </View>
        <Block height={29} width={86} pill />
      </View>
      <View style={styles.actions}>
        <Block height={46} width="48%" pill />
        <Block height={46} width="48%" pill />
      </View>
      <Block height={28} width="38%" />
      <View style={styles.detailCard}>
        <View style={styles.compatibleRow}>
          <View style={styles.compatibleImage} />
          <View style={styles.copy}>
            <Block height={10} width="28%" />
            <Block height={15} width="48%" />
          </View>
        </View>
        <View style={styles.compatibleRow}>
          <View style={styles.compatibleImage} />
          <View style={styles.copy}>
            <Block height={10} width="34%" />
            <Block height={15} width="54%" />
          </View>
        </View>
      </View>
      <Block height={28} width="32%" />
      <CoverHistorySkeleton />
    </View>
  );
}

function DeviceDetailSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.deviceSummary}>
        <View style={styles.summaryImage} />
        <View style={styles.copy}>
          <Block height={12} width="52%" />
          <Block height={30} width="42%" />
          <Block height={14} width="88%" />
        </View>
      </View>
      <View style={styles.stackTight}>
        <Block height={18} width="30%" />
        <Block height={14} width="68%" />
        <DeviceSkeleton />
        <DeviceSkeleton />
      </View>
      <View style={styles.actions}>
        <Block height={46} width="48%" pill />
        <Block height={46} width="48%" pill />
      </View>
    </View>
  );
}

function ActivityDetailSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.activityHero}>
        <View style={styles.heroIcon} />
        <View style={styles.copy}>
          <Block height={12} width="30%" />
          <Block height={19} width="70%" />
          <Block height={13} width="84%" />
        </View>
      </View>
      <View style={styles.movementCard}>
        <Block height={11} width="34%" />
        <View style={styles.movementLine}>
          <Block height={28} width={74} />
          <Block height={19} width={62} />
        </View>
        <Block height={13} width="70%" />
      </View>
      <View style={styles.detailCard}>
        <Block height={11} width="34%" />
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={styles.detailLine}>
            <Block height={14} width="26%" />
            <Block height={14} width="44%" />
          </View>
        ))}
      </View>
      <View style={styles.coverLink}>
        <Block height={16} width="48%" />
        <Block height={18} width={18} />
      </View>
    </View>
  );
}

function ActivityListSkeleton({ count }: { count: number }) {
  const rows = Math.max(1, Math.min(count, 5));
  return (
    <View style={styles.stack}>
      <View style={styles.activitySummary}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.summaryMetric}>
            <Block height={25} width={24} />
            <Block height={12} width={44} />
          </View>
        ))}
      </View>
      <View style={styles.sectionHead}>
        <Block height={18} width={88} />
        <Block height={12} width={72} />
      </View>
      <View style={styles.activityList}>
        {Array.from({ length: rows }, (_, item) => (
          <ActivitySkeleton key={item} last={item === rows - 1} />
        ))}
      </View>
    </View>
  );
}

function AppSkeleton({ count }: { count: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }, (_, item) => (
        <CoverSkeleton key={item} />
      ))}
    </View>
  );
}

export function SkeletonList({
  count = 3,
  variant = "cover",
}: {
  count?: number;
  variant?: SkeletonVariant;
}) {
  const content = (() => {
    if (variant === "dashboard") return <DashboardSkeleton />;
    if (variant === "coverDetail") return <CoverDetailSkeleton />;
    if (variant === "deviceDetail") return <DeviceDetailSkeleton />;
    if (variant === "activityDetail") return <ActivityDetailSkeleton />;
    if (variant === "activity") return <ActivityListSkeleton count={count} />;
    if (variant === "app") return <AppSkeleton count={count} />;

    const Item =
      variant === "brand"
        ? BrandSkeleton
        : variant === "device"
          ? DeviceSkeleton
          : variant === "deviceWithoutBrand"
            ? () => <DeviceSkeleton showBrand={false} />
            : variant === "coverWithActions"
              ? () => <CoverSkeleton withActions />
              : CoverSkeleton;
    return (
      <View style={styles.stack}>
        {Array.from({ length: count }, (_, item) => (
          <Item key={item} />
        ))}
      </View>
    );
  })();

  return (
    <View accessibilityLabel="Loading content" accessibilityLiveRegion="polite">
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
  pill: { borderRadius: radius.pill },
  stack: { gap: spacing.lg },
  stackTight: { gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
  coverCard: { ...commonStyles.card, gap: spacing.sm },
  coverTop: { alignItems: "center", flexDirection: "row" },
  coverImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    marginRight: spacing.sm,
    width: 42,
  },
  coverMeta: { marginLeft: 42 + spacing.sm },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  deviceCard: {
    ...commonStyles.card,
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  deviceImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 58,
    width: 58,
  },
  deviceCount: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    gap: 3,
    minWidth: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  brandCard: {
    ...commonStyles.card,
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  brandLogo: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 48,
    width: 48,
  },
  modelCount: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    justifyContent: "space-between",
    minHeight: 100,
    padding: spacing.md,
    width: "48%",
  },
  salesCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  salesHead: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.xs,
    height: 136,
    justifyContent: "space-between",
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
    gap: 5,
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 88,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: 18,
  },
  bar: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    width: "100%",
  },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dashboardActivity: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  dashboardDot: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 10,
    width: 10,
  },
  stockCard: {
    ...commonStyles.card,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailCard: { ...commonStyles.card, gap: spacing.sm },
  compatibleRow: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.xs,
  },
  compatibleImage: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 42,
    width: 42,
  },
  deviceSummary: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryImage: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 112,
    width: 112,
  },
  activitySummary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: spacing.md,
  },
  summaryMetric: { alignItems: "center", flex: 1, gap: 2 },
  activityList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  activityRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  activityBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  activityIcon: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 42,
    width: 42,
  },
  activityMeta: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  activityMovement: { alignItems: "flex-end", gap: 4, minWidth: 54 },
  coverHistory: {
    ...commonStyles.card,
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  historyDot: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  activityHero: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  heroIcon: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 54,
    width: 54,
  },
  movementCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  movementLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coverLink: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
});
