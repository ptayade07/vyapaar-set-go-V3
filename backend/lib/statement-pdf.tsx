import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type StatementRow = {
  date: string;
  description: string;
  type: string;
  amountText: string;
  balanceText: string;
};

// The shop-fields part of StatementProps, pulled out on purpose: this is the thing Stage 4 wired
// up (see PRODUCTION_STAGES.md), and unit-testing this small pure mapping is the reliable way to
// verify a shop's real identity reaches the PDF -- parsing the generated PDF bytes back out isn't,
// since @react-pdf/renderer's output is typically compressed inside the PDF structure.
export type ShopStatementFields = {
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  shopLogoUrl: string | null;
};

export function buildShopStatementFields(shop: {
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
}): ShopStatementFields {
  return {
    shopName: shop.name,
    shopAddress: shop.address,
    shopPhone: shop.phone,
    shopLogoUrl: shop.logoUrl,
  };
}

export type StatementProps = ShopStatementFields & {
  customerName: string;
  customerPhone: string | null;
  balanceLabel: string;
  balanceTone: "udhaar" | "advance" | "settled";
  balanceText: string;
  generatedAt: string;
  rows: StatementRow[];
};

const TONE_COLOR: Record<StatementProps["balanceTone"], string> = {
  udhaar: "#B91C1C",
  advance: "#15803D",
  settled: "#4B5563",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1F2937", fontFamily: "Helvetica" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 40, height: 40, borderRadius: 4 },
  shopName: { fontSize: 18, fontWeight: 700, color: "#B8460E" },
  shopContact: { fontSize: 8.5, color: "#6B7280", marginTop: 2 },
  meta: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  divider: { height: 1.2, backgroundColor: "#B8460E", marginVertical: 12 },
  customerCard: {
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E5D7C3",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  customerName: { fontSize: 13, fontWeight: 700 },
  customerPhone: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  balanceLabel: { fontSize: 9, color: "#6B7280" },
  balanceValue: { fontSize: 14, fontWeight: 700 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#B8460E",
    color: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  row: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: "#E5D7C3" },
  rowAlt: { backgroundColor: "#FAF8F5" },
  colDate: { width: "22%", fontSize: 8.5 },
  colDesc: { width: "36%", fontSize: 8.5 },
  colAmount: { width: "21%", fontSize: 8.5, textAlign: "right" },
  colBalance: { width: "21%", fontSize: 8.5, textAlign: "right" },
  headerText: { fontSize: 8.5, fontWeight: 700 },
  footer: { marginTop: 20, fontSize: 8, color: "#9CA3AF" },
});

export function CustomerStatementDocument(props: StatementProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{props.shopName}</Text>
            {props.shopAddress ? <Text style={styles.shopContact}>{props.shopAddress}</Text> : null}
            {props.shopPhone ? <Text style={styles.shopContact}>{props.shopPhone}</Text> : null}
            <Text style={styles.meta}>Statement generated {props.generatedAt}</Text>
          </View>
          {props.shopLogoUrl ? <Image src={props.shopLogoUrl} style={styles.logo} /> : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.customerCard}>
          <Text style={styles.customerName}>{props.customerName}</Text>
          <Text style={styles.customerPhone}>{props.customerPhone || "No phone on file"}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>
              {props.balanceTone === "udhaar"
                ? "UDHAAR (owes you)"
                : props.balanceTone === "advance"
                  ? "ADVANCE (in credit)"
                  : "SETTLED"}
            </Text>
            <Text style={[styles.balanceValue, { color: TONE_COLOR[props.balanceTone] }]}>{props.balanceText}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.colDate, styles.headerText]}>Date</Text>
          <Text style={[styles.colDesc, styles.headerText]}>Description</Text>
          <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
          <Text style={[styles.colBalance, styles.headerText]}>Balance</Text>
        </View>
        {props.rows.map((row, index) => (
          <View key={index} style={[styles.row, ...(index % 2 === 1 ? [styles.rowAlt] : [])]}>
            <Text style={styles.colDate}>{row.date}</Text>
            <Text style={styles.colDesc}>{row.description}</Text>
            <Text
              style={[
                styles.colAmount,
                { color: row.type === "UDHAAR" ? "#B91C1C" : "#15803D" },
              ]}
            >
              {row.amountText}
            </Text>
            <Text style={styles.colBalance}>{row.balanceText}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          This statement was generated on {props.generatedAt} by {props.shopName}. Amounts shown are as recorded in
          the shop&apos;s digital khata.
        </Text>
      </Page>
    </Document>
  );
}
