import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type StatementRow = {
  date: string;
  description: string;
  type: string;
  amountText: string;
  balanceText: string;
};

export type StatementProps = {
  shopName: string;
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
  shopName: { fontSize: 18, fontWeight: 700, color: "#B8460E" },
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
        <Text style={styles.shopName}>{props.shopName}</Text>
        <Text style={styles.meta}>Statement generated {props.generatedAt}</Text>

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
