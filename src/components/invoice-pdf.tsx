import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  section: { margin: 10, padding: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 12, color: 'grey' },
  value: { fontSize: 12, fontWeight: 'bold' },
  total: { marginTop: 20, fontSize: 18, borderTop: '1px solid black', paddingTop: 10 }
});

// The Component
export const InvoicePDF = ({ payment, lease }: { payment: any, lease: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Rent Receipt</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Receipt ID:</Text>
          <Text style={styles.value}>{payment.id.split('-')[0]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{payment.dateReceived.toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tenant:</Text>
          <Text style={styles.value}>{lease.tenant.name}</Text>
        </View>
         <View style={styles.row}>
          <Text style={styles.label}>Property:</Text>
          <Text style={styles.value}>{lease.unit.property.name}, Unit {lease.unit.unitNumber}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ marginBottom: 10, fontSize: 14 }}>Payment Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Method:</Text>
          <Text style={styles.value}>{payment.method}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.total}>Amount Paid:</Text>
          <Text style={styles.total}>${(payment.amount / 100).toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center' }}>
        <Text style={{ fontSize: 10, color: 'grey' }}>Thank you for your payment.</Text>
      </View>
    </Page>
  </Document>
);