package com.indtrans.freight.service;

import com.indtrans.freight.model.CargoItem;
import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.util.AmountInWords;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class GcnPrintTemplateService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final List<String> COPY_LABELS = List.of("DRIVER COPY", "CONSIGNEE COPY", "CONSIGNOR COPY");

    private final AmountInWords amountInWords;

    @Value("${app.company.name:INDTRANS FREIGHT SOLUTIONS LLP}")
    private String companyName;

    @Value("${app.company.address:}")
    private String companyAddress;

    @Value("${app.company.phone:}")
    private String companyPhone;

    @Value("${app.company.email:}")
    private String companyEmail;

    @Value("${app.company.pan:}")
    private String companyPan;

    @Value("${app.company.gst:}")
    private String companyGst;

    public GcnPrintTemplateService(AmountInWords amountInWords) {
        this.amountInWords = amountInWords;
    }

    public String buildPrintableHtml(Gcn gcn, List<CargoItem> cargoItems, String vehicleNumber, boolean autoPrint) {
        PrintData data = buildPrintData(gcn, cargoItems, vehicleNumber);
        StringBuilder copiesHtml = new StringBuilder();

        for (int i = 0; i < COPY_LABELS.size(); i++) {
            copiesHtml.append(buildCopyHtml(data, COPY_LABELS.get(i), i == COPY_LABELS.size() - 1));
        }

        String title = "Consignment Note - " + safe(data.gcnNumber(), gcn.getId());

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%s</title>
                  <style>
                    @page { size: A4; margin: 5mm; }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    html, body { height: 100%%; }
                    body {
                      font-family: Arial, Helvetica, sans-serif;
                      font-size: 10pt;
                      color: #000;
                      background: #fff;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                    .page-wrapper {
                      position: relative;
                      width: 100%%;
                      min-height: 287mm;
                      display: flex;
                      flex-direction: column;
                      overflow: hidden;
                    }
                    .watermark {
                      position: absolute;
                      top: 50%%;
                      left: 50%%;
                      transform: translate(-50%%, -50%%) rotate(-18deg);
                      opacity: 0.07;
                      font-size: 52pt;
                      font-weight: 900;
                      letter-spacing: 8px;
                      color: #1a3a5c;
                      z-index: 0;
                      pointer-events: none;
                      white-space: nowrap;
                    }
                    .wrapper {
                      width: 100%%;
                      border: 2px solid #000;
                      position: relative;
                      z-index: 1;
                      flex: 1;
                      display: flex;
                      flex-direction: column;
                      background: #fff;
                    }
                    .header {
                      display: flex;
                      align-items: stretch;
                      border-bottom: 2px solid #000;
                    }
                    .header-logo {
                      flex: 1;
                      padding: 8px 12px;
                      border-right: 1px solid #000;
                    }
                    .brand {
                      display: flex;
                      gap: 12px;
                      align-items: center;
                    }
                    .brand-logo {
                      width: 84px;
                      height: 84px;
                      object-fit: contain;
                      flex: 0 0 84px;
                    }
                    .brand-copy .company-head {
                      font-size: 24pt;
                      font-weight: 900;
                      letter-spacing: 1px;
                      color: #e87722;
                      line-height: 1.05;
                    }
                    .brand-copy .company-subhead {
                      font-size: 14pt;
                      font-weight: 900;
                      color: #333;
                      line-height: 1.1;
                    }
                    .brand-copy .slogan {
                      font-size: 9pt;
                      color: #1a3a5c;
                      font-style: italic;
                      font-weight: bold;
                      margin-top: 3px;
                    }
                    .brand-copy .address {
                      font-size: 8.5pt;
                      color: #333;
                      margin-top: 5px;
                      line-height: 1.45;
                    }
                    .header-meta {
                      width: 210px;
                      padding: 8px 10px;
                      font-size: 9pt;
                      color: #000;
                      display: flex;
                      flex-direction: column;
                      gap: 5px;
                    }
                    .header-meta .meta-row {
                      display: flex;
                      justify-content: space-between;
                      gap: 8px;
                    }
                    .header-meta .meta-label {
                      font-weight: bold;
                    }
                    .title-bar {
                      background: #e8e8e8;
                      color: #000;
                      text-align: center;
                      padding: 6px;
                      font-size: 12pt;
                      font-weight: bold;
                      letter-spacing: 2px;
                      border-bottom: 1px solid #000;
                    }
                    .sub-title-bar {
                      display: flex;
                      justify-content: space-between;
                      gap: 8px;
                      padding: 4px 10px;
                      font-size: 9pt;
                      border-bottom: 1px solid #000;
                      background: #f5f7fa;
                    }
                    table { width: 100%%; border-collapse: collapse; }
                    td, th { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
                    .label-cell { font-weight: bold; background: #f0f3f8; font-size: 9pt; }
                    .value-cell { font-size: 10pt; min-height: 24px; }
                    .addr-cell { min-height: 44px; }
                    .desc-cell { min-height: 48px; line-height: 1.45; }
                    .remarks-cell { min-height: 38px; line-height: 1.45; }
                    .section-header {
                      background: #d0d5e0;
                      color: #000;
                      font-weight: bold;
                      text-align: center;
                      font-size: 9.5pt;
                      padding: 5px;
                      letter-spacing: 0.5px;
                    }
                    .charges-table td { padding: 5px 8px; }
                    .charges-table .total-row {
                      background: #333;
                      color: #fff;
                      font-weight: bold;
                    }
                    .info-row { display: flex; margin-bottom: 5px; gap: 8px; }
                    .info-label { font-weight: bold; width: 86px; font-size: 9pt; }
                    .info-value { flex: 1; font-size: 10pt; border-bottom: 1px dotted #999; }
                    .amount-summary {
                      display: flex;
                      justify-content: space-between;
                      gap: 12px;
                      padding: 8px 12px;
                      font-size: 9pt;
                      border-top: 1px solid #000;
                      border-bottom: 1px solid #000;
                      background: #fbfbfd;
                    }
                    .amount-summary .amount-col { flex: 1; }
                    .amount-summary .amount-title { font-weight: bold; margin-bottom: 4px; }
                    .billed-to {
                      display: flex;
                      gap: 12px;
                      flex-wrap: wrap;
                      font-size: 10pt;
                      font-weight: bold;
                    }
                    .billed-option {
                      padding: 4px 12px;
                      border: 1.5px solid #000;
                      display: inline-block;
                      color: #000;
                      background: #fff;
                    }
                    .billed-option.active {
                      background: #1a3a5c !important;
                      color: #fff !important;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                    .signature-bar {
                      padding: 10px 12px;
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-end;
                      gap: 12px;
                      font-size: 9pt;
                      border-bottom: 1px solid #000;
                    }
                    .signature-title {
                      font-weight: bold;
                      text-align: right;
                      min-width: 190px;
                    }
                    .signature-line {
                      margin-top: 26px;
                      border-top: 1px solid #000;
                      padding-top: 4px;
                    }
                    .caution-wrapper {
                      padding: 8px 10px;
                      border-top: 1px solid #000;
                    }
                    .caution-box {
                      position: relative;
                      border: 1.5px solid #000;
                      border-radius: 4px;
                      padding: 10px 14px;
                      text-align: center;
                      overflow: hidden;
                    }
                    .caution-box::before {
                      content: "INDTRANS";
                      position: absolute;
                      top: 50%%;
                      left: 50%%;
                      transform: translate(-50%%, -50%%);
                      font-size: 28pt;
                      font-weight: 900;
                      color: #1a3a5c;
                      opacity: 0.08;
                      letter-spacing: 4px;
                    }
                    .caution-title {
                      position: relative;
                      z-index: 1;
                      font-weight: bold;
                      font-size: 10pt;
                      letter-spacing: 1px;
                      margin-bottom: 5px;
                    }
                    .caution-text {
                      position: relative;
                      z-index: 1;
                      font-size: 8.5pt;
                      line-height: 1.55;
                    }
                    .pan-note {
                      border-top: 1px solid #ccc;
                      background: #f2f4f8;
                      padding: 5px 12px 6px;
                      text-align: center;
                    }
                    .pan-note-row {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-wrap: wrap;
                      gap: 8px;
                      font-size: 8.5pt;
                      font-weight: bold;
                      color: #1a1a1a;
                    }
                    .pan-note-pan { color: #1a3a5c; font-weight: 900; letter-spacing: 0.3px; }
                    .pan-note-divider { color: #999; font-weight: normal; }
                    .pan-note-disclaimer {
                      font-size: 7.5pt;
                      color: #555;
                      font-style: italic;
                      margin-top: 2px;
                    }
                  </style>
                </head>
                <body>
                %s
                %s
                </body>
                </html>
                """.formatted(
                HtmlUtils.htmlEscape(title),
                copiesHtml,
                autoPrint ? """
                        <script>
                          window.onload = () => {
                            window.focus();
                            window.print();
                          };
                        </script>
                        """ : ""
        );
    }

    private PrintData buildPrintData(Gcn gcn, List<CargoItem> cargoItems, String vehicleNumber) {
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal totalInvoiceValue = BigDecimal.ZERO;
        int totalArticles = 0;
        Set<String> packingTypes = new LinkedHashSet<>();
        List<String> descriptions = new ArrayList<>();
        List<String> invoices = new ArrayList<>();

        for (CargoItem item : cargoItems) {
            if (!isBlank(item.getDescription())) {
                descriptions.add(item.getDescription().trim());
            }
            if (!isBlank(item.getPackingType())) {
                packingTypes.add(item.getPackingType().trim());
            }
            if (item.getQuantity() != null) {
                totalArticles += item.getQuantity();
            }
            if (item.getWeight() != null) {
                totalWeight = totalWeight.add(item.getWeight());
            }
            if (item.getInvoiceAmount() != null) {
                totalInvoiceValue = totalInvoiceValue.add(item.getInvoiceAmount());
            }

            List<String> invoiceParts = new ArrayList<>();
            if (!isBlank(item.getInvoiceNumber())) {
                invoiceParts.add(item.getInvoiceNumber().trim());
            }
            if (item.getInvoiceDate() != null) {
                invoiceParts.add(formatDate(item.getInvoiceDate()));
            }
            if (!invoiceParts.isEmpty()) {
                invoices.add(String.join(" / ", invoiceParts));
            }
        }

        BigDecimal freight = valueOrZero(gcn.getCustomerFreight());
        BigDecimal advance = valueOrZero(gcn.getAdvance());
        BigDecimal loading = valueOrZero(gcn.getLoadingCharge());
        BigDecimal unloading = valueOrZero(gcn.getUnloadingCharge());
        BigDecimal detention = valueOrZero(gcn.getDetentionCharge());
        BigDecimal others = valueOrZero(gcn.getOthersCharge());
        BigDecimal totalCharges = freight.add(loading).add(unloading).add(detention).add(others);
        BigDecimal balanceToPay = totalCharges.subtract(advance).max(BigDecimal.ZERO);
        BigDecimal rate = totalWeight.compareTo(BigDecimal.ZERO) > 0
                ? freight.divide(totalWeight, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new PrintData(
                safe(gcn.getGcnNumber(), gcn.getId()),
                formatDate(gcn.getGcnDate()),
                safe(gcn.getFromLocation(), "-"),
                safe(gcn.getToLocation(), "-"),
                safe(vehicleNumber, "-"),
                safe(gcn.getConsignorName(), "-"),
                formatMultiline(gcn.getConsignorAddress()),
                safe(gcn.getConsignorGst(), "-"),
                safe(gcn.getConsigneeName(), "-"),
                formatMultiline(gcn.getConsigneeAddress()),
                safe(gcn.getConsigneeGst(), "-"),
                descriptions.isEmpty() ? "-" : joinEscapedHtml(descriptions),
                totalArticles > 0 ? String.valueOf(totalArticles) : "-",
                packingTypes.isEmpty() ? "-" : HtmlUtils.htmlEscape(String.join(", ", packingTypes)),
                invoices.isEmpty() ? "-" : joinEscapedHtml(invoices),
                totalInvoiceValue.compareTo(BigDecimal.ZERO) > 0 ? formatMoney(totalInvoiceValue) : "-",
                totalWeight.compareTo(BigDecimal.ZERO) > 0 ? formatMoney(totalWeight) : "-",
                totalWeight.compareTo(BigDecimal.ZERO) > 0 ? formatMoney(totalWeight) : "-",
                rate.compareTo(BigDecimal.ZERO) > 0 ? formatMoney(rate) : "-",
                formatMoney(freight),
                formatMoney(advance),
                formatMoney(loading),
                formatMoney(unloading),
                formatMoney(detention),
                formatMoney(others),
                formatMoney(totalCharges),
                formatMoney(balanceToPay),
                amountInWords.convert(balanceToPay),
                formatMultiline(gcn.getRemarks()),
                buildInsuranceDisplay(gcn.getInsuranceConsignor(), gcn.getInsuranceConsignee()),
                buildBillingTypeHtml(gcn.getBillingType())
        );
    }

    private String buildCopyHtml(PrintData data, String copyLabel, boolean isLast) {
        String pageBreak = isLast ? "" : "page-break-after: always;";
        StringBuilder html = new StringBuilder();

        html.append("<div class=\"page-wrapper\" style=\"").append(pageBreak).append("\">");
        html.append("<div class=\"watermark\">INDTRANS</div>");
        html.append("<div class=\"wrapper\">");

        html.append("<div class=\"header\">");
        html.append("<div class=\"header-logo\">");
        html.append("<div class=\"brand\">");
        html.append("<img class=\"brand-logo\" src=\"/logo.jpeg\" alt=\"INDTRANS logo\" />");
        html.append("<div class=\"brand-copy\">");
        html.append("<div class=\"company-head\">INDTRANS</div>");
        html.append("<div class=\"company-subhead\">FREIGHT SOLUTIONS</div>");
        html.append("<div class=\"slogan\">Your reliable transportation partner</div>");
        html.append("<div class=\"address\">").append(formatCompanyAddress()).append("</div>");
        html.append("</div></div></div>");

        html.append("<div class=\"header-meta\">");
        appendMetaRow(html, "GST NO", safe(companyGst, "-"));
        appendMetaRow(html, "PAN", safe(companyPan, "-"));
        appendMetaRow(html, "G.C. NO", data.gcnNumber());
        appendMetaRow(html, "DATE", data.date());
        html.append("</div>");
        html.append("</div>");

        html.append("<div class=\"title-bar\">GOODS CONSIGNMENT NOTE</div>");
        html.append("<div class=\"sub-title-bar\">");
        html.append("<span style=\"font-weight:bold;\">").append(HtmlUtils.htmlEscape(copyLabel)).append("</span>");
        html.append("<span>SUBJECT TO MUMBAI JURISDICTION</span>");
        html.append("<span>INSURANCE COVERED BY: ").append(data.insuranceCoveredBy()).append("</span>");
        html.append("</div>");

        html.append("""
                <table>
                  <tr>
                    <td style="width:65%; border-right: 1px solid #000; padding:0;">
                      <table style="width:100%; border:none;">
                        <tr>
                          <td colspan="4" class="section-header">CONSIGNOR &amp; CONSIGNEE DETAILS</td>
                        </tr>
                        <tr>
                          <td style="width:50%; border-right:1px solid #000; padding:0;">
                            <table style="width:100%; border:none;">
                              <tr><td colspan="2" style="font-weight:bold; font-size:9pt; background:#e8ecf4; border-bottom:1px solid #000; padding:5px 6px;">CONSIGNOR (SENDER)</td></tr>
                """);
        appendLabelValueRow(html, "Name", HtmlUtils.htmlEscape(data.consignorName()), "");
        appendLabelValueRow(html, "Address", data.consignorAddress(), "addr-cell");
        appendLabelValueRow(html, "GST No.", HtmlUtils.htmlEscape(data.consignorGst()), "");
        html.append("""
                            </table>
                          </td>
                          <td style="width:50%; padding:0;">
                            <table style="width:100%; border:none;">
                              <tr><td colspan="2" style="font-weight:bold; font-size:9pt; background:#e8ecf4; border-bottom:1px solid #000; padding:5px 6px;">CONSIGNEE (RECEIVER)</td></tr>
                """);
        appendLabelValueRow(html, "Name", HtmlUtils.htmlEscape(data.consigneeName()), "");
        appendLabelValueRow(html, "Address", data.consigneeAddress(), "addr-cell");
        appendLabelValueRow(html, "GST No.", HtmlUtils.htmlEscape(data.consigneeGst()), "");
        html.append("""
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width:35%; vertical-align:top; padding:8px 10px;">
                      <div style="font-weight:bold; font-size:10pt; margin-bottom:6px; border-bottom:1px solid #000; padding-bottom:3px;">SHIPMENT DETAILS</div>
                """);
        appendInfoRow(html, "G.C. No.", data.gcnNumber());
        appendInfoRow(html, "Date", data.date());
        appendInfoRow(html, "From", data.fromLocation());
        appendInfoRow(html, "To", data.toLocation());
        appendInfoRow(html, "Truck No.", data.truckNumber());
        html.append("""
                    </td>
                  </tr>
                </table>

                <table>
                  <tr>
                    <td class="section-header" colspan="6">GOODS &amp; INVOICE DETAILS</td>
                  </tr>
                  <tr>
                    <td class="label-cell" style="width:20%;">Description<br/>(Said to Contain)</td>
                    <td class="value-cell desc-cell" style="width:30%;">""").append(data.descriptionHtml()).append("""
                    </td>
                    <td class="label-cell" style="width:14%;">No. of Articles</td>
                    <td class="value-cell" style="width:12%;">""").append(HtmlUtils.htmlEscape(data.numberOfArticles())).append("""
                    </td>
                    <td class="label-cell" style="width:12%;">Mode of<br/>Packing</td>
                    <td class="value-cell" style="width:12%;">""").append(data.modeOfPacking()).append("""
                    </td>
                  </tr>
                  <tr>
                    <td class="label-cell">Invoice No. &amp; Date</td>
                    <td class="value-cell">""").append(data.invoiceSummary()).append("""
                    </td>
                    <td class="label-cell">Invoice Value (Rs.)</td>
                    <td class="value-cell" colspan="3">""").append(HtmlUtils.htmlEscape(data.invoiceValue())).append("""
                    </td>
                  </tr>
                </table>

                <table>
                  <tr>
                    <td style="width:58%; padding:0; border-right:1px solid #000;">
                      <table style="width:100%; border:none;">
                        <tr>
                          <td colspan="6" class="section-header">WEIGHT &amp; RATE</td>
                        </tr>
                        <tr>
                          <td class="label-cell" style="width:28%;">Weight Actual (Kgs)</td>
                          <td class="value-cell" style="width:14%;">""").append(HtmlUtils.htmlEscape(data.weightActual())).append("""
                          </td>
                          <td class="label-cell" style="width:28%;">Weight Charged (Kgs)</td>
                          <td class="value-cell" style="width:14%;">""").append(HtmlUtils.htmlEscape(data.weightCharged())).append("""
                          </td>
                          <td class="label-cell" style="width:16%;">Rate (Rs/Kg)</td>
                          <td class="value-cell">""").append(HtmlUtils.htmlEscape(data.ratePerKg())).append("""
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width:42%; padding:0; vertical-align:top;">
                      <table class="charges-table" style="width:100%; border:none;">
                        <tr>
                          <td colspan="2" class="section-header">CHARGES</td>
                        </tr>
                """);
        appendChargeRow(html, "Freight (Rs.)", data.freight());
        appendChargeRow(html, "Advance (Rs.)", data.advance());
        appendChargeRow(html, "Loading (Rs.)", data.loading());
        appendChargeRow(html, "Unloading (Rs.)", data.unloading());
        appendChargeRow(html, "Detention (Rs.)", data.detention());
        appendChargeRow(html, "Other Charges (Rs.)", data.others());
        html.append("""
                        <tr class="total-row">
                          <td>Total Charges</td>
                          <td>""").append(HtmlUtils.htmlEscape(data.totalCharges())).append("""
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div class="amount-summary">
                  <div class="amount-col">
                    <div class="amount-title">Amount To Pay</div>
                    <div><strong>Rs. """).append(HtmlUtils.htmlEscape(data.amountToPay())).append("""
                    </strong></div>
                    <div style="margin-top:4px;">""").append(HtmlUtils.htmlEscape(data.amountInWords())).append("""
                    </div>
                  </div>
                  <div class="amount-col">
                    <div class="amount-title">Billed To</div>
                    <div class="billed-to">""").append(data.billingTypeHtml()).append("""
                    </div>
                  </div>
                </div>

                <table>
                  <tr>
                    <td class="section-header" colspan="2">PAYMENT TERMS &amp; REMARKS</td>
                  </tr>
                  <tr>
                    <td class="label-cell" style="width:28%;">Remarks</td>
                    <td class="value-cell remarks-cell">""").append(data.remarks()).append("""
                    </td>
                  </tr>
                </table>

                <div class="signature-bar">
                  <div>
                    <div><strong>Goods transported at owner's risk.</strong></div>
                    <div style="margin-top:4px;">GST liability on consignor / consignee.</div>
                  </div>
                  <div class="signature-title">
                    For """).append(HtmlUtils.htmlEscape(safe(companyName, "INDTRANS FREIGHT SOLUTIONS LLP"))).append("""
                    <div class="signature-line">Authorised Signature</div>
                  </div>
                </div>

                <div class="caution-wrapper">
                  <div class="caution-box">
                    <div class="caution-title">CAUTION</div>
                    <div class="caution-text">
                      This consignment will not be detained, delivered, re-routed or re-booked without
                      consignee or bank written permission and will be delivered only at the named destination.
                    </div>
                  </div>
                </div>

                <div class="pan-note">
                  <div class="pan-note-row">
                    <span class="pan-note-pan">PAN NO: """).append(HtmlUtils.htmlEscape(safe(companyPan, "-"))).append("""
                    </span>
                    <span class="pan-note-divider">|</span>
                    <span>Goods transported at owner's risk.</span>
                    <span class="pan-note-divider">|</span>
                    <span>GST liability on consignor / consignee.</span>
                  </div>
                  <div class="pan-note-disclaimer">
                    Company is not responsible for any damage or loss of goods during transit.
                  </div>
                </div>
                """);

        html.append("</div>");
        html.append("</div>");
        return html.toString();
    }

    private void appendMetaRow(StringBuilder html, String label, String value) {
        html.append("<div class=\"meta-row\"><span class=\"meta-label\">")
                .append(HtmlUtils.htmlEscape(label))
                .append("</span><span>")
                .append(HtmlUtils.htmlEscape(value))
                .append("</span></div>");
    }

    private void appendLabelValueRow(StringBuilder html, String label, String value, String extraClassName) {
        html.append("<tr><td class=\"label-cell\">")
                .append(HtmlUtils.htmlEscape(label))
                .append("</td><td class=\"value-cell");
        if (!extraClassName.isBlank()) {
            html.append(" ").append(extraClassName);
        }
        html.append("\">")
                .append(value)
                .append("</td></tr>");
    }

    private void appendInfoRow(StringBuilder html, String label, String value) {
        html.append("<div class=\"info-row\"><span class=\"info-label\">")
                .append(HtmlUtils.htmlEscape(label))
                .append("</span><span class=\"info-value\">")
                .append(HtmlUtils.htmlEscape(value))
                .append("</span></div>");
    }

    private void appendChargeRow(StringBuilder html, String label, String value) {
        html.append("<tr><td class=\"label-cell\" style=\"width:62%;\">")
                .append(HtmlUtils.htmlEscape(label))
                .append("</td><td class=\"value-cell\">")
                .append(HtmlUtils.htmlEscape(value))
                .append("</td></tr>");
    }

    private String buildInsuranceDisplay(Boolean insuranceConsignor, Boolean insuranceConsignee) {
        boolean consignor = Boolean.TRUE.equals(insuranceConsignor);
        boolean consignee = Boolean.TRUE.equals(insuranceConsignee);
        return (consignor ? "&#9745;" : "&#9744;") + " CONSIGNOR &nbsp;&nbsp; "
                + (consignee ? "&#9745;" : "&#9744;") + " CONSIGNEE";
    }

    private String buildBillingTypeHtml(String billingType) {
        String normalized = safe(billingType, "TO_BE_BILLED").toUpperCase();
        return buildBillingOption("TO PAY", "TO_PAY".equals(normalized))
                + buildBillingOption("PAID", "PAID".equals(normalized))
                + buildBillingOption("TO BE BILLED", "TO_BE_BILLED".equals(normalized));
    }

    private String buildBillingOption(String label, boolean active) {
        return "<span class=\"billed-option" + (active ? " active" : "") + "\">"
                + HtmlUtils.htmlEscape(label) + "</span>";
    }

    private String joinEscapedHtml(List<String> values) {
        StringBuilder joined = new StringBuilder();
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                joined.append("<br/>");
            }
            joined.append(HtmlUtils.htmlEscape(values.get(i)));
        }
        return joined.toString();
    }

    private String formatCompanyAddress() {
        StringBuilder address = new StringBuilder(formatMultiline(companyAddress));
        if (!isBlank(companyPhone) || !isBlank(companyEmail)) {
            address.append("<br/>");
            if (!isBlank(companyPhone)) {
                address.append("Phone: ").append(HtmlUtils.htmlEscape(companyPhone));
            }
            if (!isBlank(companyPhone) && !isBlank(companyEmail)) {
                address.append(" | ");
            }
            if (!isBlank(companyEmail)) {
                address.append("Email: ").append(HtmlUtils.htmlEscape(companyEmail));
            }
        }
        return address.toString();
    }

    private String formatMultiline(String value) {
        if (isBlank(value)) {
            return "-";
        }
        return HtmlUtils.htmlEscape(value).replace("\r\n", "\n").replace("\n", "<br/>");
    }

    private String formatDate(LocalDate value) {
        return value == null ? "-" : DATE_FORMATTER.format(value);
    }

    private String formatMoney(BigDecimal value) {
        return value == null ? "-" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String safe(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record PrintData(
            String gcnNumber,
            String date,
            String fromLocation,
            String toLocation,
            String truckNumber,
            String consignorName,
            String consignorAddress,
            String consignorGst,
            String consigneeName,
            String consigneeAddress,
            String consigneeGst,
            String descriptionHtml,
            String numberOfArticles,
            String modeOfPacking,
            String invoiceSummary,
            String invoiceValue,
            String weightActual,
            String weightCharged,
            String ratePerKg,
            String freight,
            String advance,
            String loading,
            String unloading,
            String detention,
            String others,
            String totalCharges,
            String amountToPay,
            String amountInWords,
            String remarks,
            String insuranceCoveredBy,
            String billingTypeHtml
    ) {
    }
}
