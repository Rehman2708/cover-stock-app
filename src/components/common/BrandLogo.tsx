import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../design-system/tokens";

const brandDomains: Record<string, string> = {
  apple: "apple.com",
  asus: "asus.com",
  google: "google.com",
  hmd: "hmd.com",
  honor: "honor.com",
  huawei: "huawei.com",
  infinix: "infinixmobility.com",
  iqoo: "iqoo.com",
  lava: "lavamobiles.com",
  lenovo: "lenovo.com",
  lg: "lg.com",
  meizu: "meizu.com",
  microsoft: "microsoft.com",
  motorola: "motorola.com",
  nokia: "nokia.com",
  nothing: "nothing.tech",
  oneplus: "oneplus.com",
  oppo: "oppo.com",
  poco: "po.co",
  realme: "realme.com",
  redmi: "mi.com",
  samsung: "samsung.com",
  sony: "sony.com",
  tecno: "tecno-mobile.com",
  vivo: "vivo.com",
  xiaomi: "mi.com",
  zte: "zte.com.cn",
};

function initials(brand: string) {
  return (
    brand
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function BrandLogo({
  brand,
  size = 48,
}: {
  brand: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const domain = brandDomains[brand.trim().toLocaleLowerCase()];
  if (!domain || failed)
    return (
      <View
        accessibilityLabel={`${brand} logo unavailable`}
        style={[styles.fallback, { height: size, width: size }]}
      >
        <Text style={styles.initials}>{initials(brand)}</Text>
      </View>
    );
  return (
    <Image
      accessibilityLabel={`${brand} logo`}
      onError={() => setFailed(true)}
      source={{
        uri: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      }}
      style={[styles.logo, { height: size, width: size }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    justifyContent: "center",
  },
  initials: { color: colors.primary, fontSize: 15, fontWeight: "900" },
});
