
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BusyIndicator from "sap/ui/core/BusyIndicator";


/**Value Helps */
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import SearchField from "sap/m/SearchField";
import TypeString from 'sap/ui/model/type/String'
import Label from "sap/m/Label";
import UIColumn from "sap/ui/table/Column";
import MColumn from "sap/m/Column";
import Text from "sap/m/Text";
import ColumnListItem from "sap/m/ColumnListItem";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import DateFormat from "sap/ui/core/format/DateFormat";
import Input from "sap/m/Input";
import MessageBox from "sap/m/MessageBox";
import { DatePicker$ChangeEvent } from "sap/m/DatePicker";


export default class CreateHeader extends Controller {

    public oDataModel: ODataModel;
    public header = new JSONModel();
    public lineView: JSONModel;
    public headerview = new JSONModel();
    public currentView: any;
    public prevEntryType: string;
    public _pDialog: any;
    public matchingPAN: string = "";
    public selectedVendor: string = "";
    public lowestDate: Date;

    public headerFields = {
        "RefDoc": { "Editable": true, "Label": "PO No", Visible: true },
        "EntryType": { "Editable": true, "Label": "Entry Type", Visible: true },
        "BillAmount": { "Editable": true, "Label": "Bill Amount", Visible: true },
        "InDate": { "Editable": true, "Label": "In Date/Time", Visible: true },
        "OutDate": { "Editable": true, "Label": "Out Date/Time", Visible: false },
        "InvoicePartyName": { "Editable": true, "Label": "Invoicing Party Name", Visible: false },
        "InvoiceParty": { "Editable": true, "Label": "Invoicing Party", Visible: true, Required: true },
        "InvoicePartyGST": { "Editable": false, "Label": "Invoicing Party GST", Visible: true },
        "ExpectedReturnDate": { "Editable": true, "Label": "Expected Return Date", Visible: false, Required: true },
    }

    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("GateEntryCreate").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(): void {
        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY/");
        (this.byId("EntryHeader") as any).setModel(this.header, "Header");
        this.header.setProperty("/", {});
        (this.byId("EntryHeader") as any).setModel(this.headerview, "View");
        this.headerview.setProperty("/", { ...this.headerFields });

        var oNow = new Date();

        // Format date as "yyyy-MM-ddTHH:mm:ss" (for DatePicker)
        var oDateFormatter = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" });
        var sFormattedDate = oDateFormatter.format(oNow);

        // Format time as "HH:mm:ss" (for TimePicker)
        var oTimeFormatter = DateFormat.getTimeInstance({ pattern: "PTHH'H'mm'M'ss'S'" });
        var sFormattedTime = oTimeFormatter.format(oNow);

        // Set values in the model
        this.header.setProperty("/GateInDate", sFormattedDate);
        this.header.setProperty("/GateOutDate", sFormattedDate);
        this.header.setProperty("/GateInTime", sFormattedTime);
        this.header.setProperty("/GateOutTime", sFormattedTime);
        this.header.setProperty("/GrossWt", "0.00");
        this.header.setProperty("/TareWt", "0.00");
        this.header.setProperty("/NetWt", "0.00");
        this.header.setProperty("/EntryType", "PUR");
        (this.byId("EntryType") as any).setEditable(true);
        this.selectedVendor = "";
        this.lowestDate = new Date();
    }

    public refreshSettings() {
        this.lineView = (this.getView() as any).getParent().getParent().getParent().byId("createLines").byId("_IDGenTable1").getModel("View");
        this.currentView = this.getOwnerComponent()?.getModel("LinesSettings")?.getProperty("/");
        this.lineView.setProperty("/", { ...this.currentView });
        this.headerview.setProperty("/", { ...this.headerFields });
    }

    public InvoicePartyChange(oEvent: any) {
        if (!oEvent.getParameters().value) {
            this.header.setProperty("/InvoicePartyName", "");
            this.header.setProperty("/InvoicePartyGST", "");
            (this.byId("InvoicePartyName") as any).setEditable(true);
        }
    }

    public checkEntryTypeAdded() {
        if (!this.header.getProperty("/EntryType")) {
            MessageBox.error("Entry Type not Selected.");
            return false;
        }
        return true;
    }

    public billdatechange(oEvent: any) {
        let billval = new Date(new Date(oEvent.mParameters.value).toDateString()).getTime();
        let lowVal = new Date(this.lowestDate.toDateString()).getTime();
        if (this.header.getProperty("/EntryType") === "PUR" && (billval < lowVal)) {
            MessageBox.error("Bill Date should be greater or equal than PO Date.");
            this.header.setProperty("/InvoiceDate", "")
        }
    }

    public docnochange(oEvent: any) {
        let that = this;
        let Document = oEvent.getParameters().value;
        if (!Document) return;
        if (!this.checkEntryTypeAdded()) return;
        this.oDataModel.read("/DocumentVH", {
            filters: [new Filter("DocumentNo", FilterOperator.EQ, Document), new Filter("EntryType", FilterOperator.EQ, this.header.getProperty("/EntryType"))],
            success: function (response: any) {
                let OProperty = (that.getView() as any).getParent().getParent().getParent().byId("createLines").byId("_IDGenTable1").getModel("Details").getProperty("/OrderDetailsTable") || [];
                if (OProperty.length <= 0) that.selectedVendor = "";
                if (response.results.length <= 0) {
                    MessageBox.warning(Document + " is not available in " + (that.header.getProperty("/EntryType") || ""))
                    BusyIndicator.hide();
                    return;
                }

                let selectedDoc: string[] = [],
                    vendorName = that.header.getProperty("/InvoicePartyName") || "",
                    emptyVend = false;



                for (let index = 0; index < response.results.length; index++) {
                    const object = response.results[index];

                    if (vendorName && response.results[index].InvoicingPartyName !== vendorName && that.header.getProperty("/EntryType") !== 'PUR') {
                        if (!selectedDoc.includes(object.DocumentNo)) selectedDoc.push(object.DocumentNo);
                        continue;
                    }
                    else if (that.selectedVendor && response.results[index].InvoicingPartyName !== that.selectedVendor && that.header.getProperty("/EntryType") === 'PUR') {
                        if (!selectedDoc.includes(object.DocumentNo)) selectedDoc.push(object.DocumentNo);
                        continue;
                    }
                    else if (!vendorName) { vendorName = object.InvoicingPartyName; emptyVend = true; that.selectedVendor = object.InvoicingPartyName; }

                    let obDate = new Date(new Date(object.DocumentDate).toDateString()).getTime();
                    let lowerdate = new Date(that.lowestDate.toDateString()).getTime();
                    if (lowerdate > obDate) {
                        that.lowestDate = new Date(object.DocumentDate);
                    }


                    OProperty.push({
                        DocumentNo: object.DocumentNo,
                        DocumentItemNo: object.DocumentItemNo,
                        Plant: object.Plant,
                        SLoc: object.StorageLocation,
                        ProductCode: object.DocumentItem,
                        ProductDesc: object.DocumentItemText,
                        PartyCode: object.InvoicingParty,
                        PartyName: object.InvoicingPartyName,
                        GateQty: Number(that.header.getProperty("/EntryType") === "PUR" || that.header.getProperty("/EntryType") === "RGP-OUT" ? 0 : object.DocumentItemQty).toFixed(3),
                        GateValue: Number(object.DocumentItemPrice).toFixed(2),
                        UOM: object.DocumentItemQtyUnit,
                        BalQty: Number(object.BalQty).toFixed(3),
                        GST: object.GST,
                        Rate: Number(object.Rate).toFixed(2),
                        OrderQty: Number(object.DocumentItemQty).toFixed(3),
                        Tolerance: Number(object.ToleranceQty).toFixed(3)
                    })

                    that.matchingPAN = object.InvoicingPartyPAN;

                }
                (that.getView() as any).getParent().getParent().getParent().byId("createLines").byId("_IDGenTable1").getModel("Details").setProperty("/OrderDetailsTable", OProperty);
                (that.byId("EntryType") as any).setEditable(false);
                if (selectedDoc.length > 0) {
                    MessageBox.warning("Vendor Code Mismatch with Documents - " + selectedDoc.join(","));
                    if (!emptyVend) {
                        BusyIndicator.hide();
                        return;
                    }
                }
                if (response.results[0]?.InvoicingParty && that.header.getProperty("/EntryType") !== "PUR") {
                    that.oDataModel.read("/InvoicePartyVH", {
                        filters: [new Filter("InvoicingParty", FilterOperator.EQ, response.results[0].InvoicingParty)],
                        success: function (response: any) {
                            that.header.setProperty("/InvoiceParty", response.results[0].InvoicingParty);
                            that.header.setProperty("/InvoicePartyName", response.results[0].InvoicingPartyName);
                            that.header.setProperty("/InvoicePartyGST", response.results[0].InvoicingPartyGST);
                            if (that.header.getProperty("/EntryType") === "RGP-IN") {
                                that.headerview.setProperty("/InvoiceParty", {
                                    ...that.headerview.getProperty("/InvoiceParty"),
                                    Editable: false
                                })
                                that.headerview.setProperty("/InvoicePartyName", {
                                    ...that.headerview.getProperty("/InvoicePartyName"),
                                    Editable: false
                                })
                            }
                        }
                    });
                };

                (that.byId("RefDoc") as Input).setValue("");
                BusyIndicator.hide();
            }
        })

    }

    public entryTypeChange(oEvt: any) {
        let EntryType = this.header.getProperty("/EntryType") || "";


        if (this.prevEntryType === EntryType) return;
        if (!this.prevEntryType) this.prevEntryType = this.header.getProperty("/EntryType") || "";
        this.prevEntryType = this.header.getProperty("/EntryType") || "";

        this.refreshSettings();

        switch (EntryType) {
            case "PUR":
                break;
            case "RGP-IN":
            case "RGP-OUT":
            case "WREF":
            case "NRGP":
                this.lineView.setProperty("/PartyCode", {
                    ...this.currentView.PartyCode,
                    "Visible": false
                });
                this.lineView.setProperty("/SLoc", {
                    ...this.currentView.SLoc,
                    "Visible": false
                });
                this.lineView.setProperty("/UOM", {
                    ...this.currentView.UOM,
                    "Editable": true
                });
                this.lineView.setProperty("/Rate", {
                    ...this.currentView.Rate,
                    "Editable": true
                });
                this.lineView.setProperty("/DocumentNo", {
                    ...this.currentView.DocumentNo,
                    "Visible": false
                });
                this.lineView.setProperty("/PartyName", {
                    ...this.currentView.PartyName,
                    "Visible": false
                });
                this.lineView.setProperty("/GateValue", {
                    ...this.currentView.GateValue,
                    "Label": "Amount"
                });
                this.lineView.setProperty("/Remarks", {
                    ...this.currentView.Remarks,
                    "Label": "Purpose"
                });
                this.lineView.setProperty("/Plant", {
                    ...this.currentView.Plant,
                    "Editable": true
                });
                this.lineView.setProperty("/ProductCode", {
                    ...this.currentView.ProductCode,
                    "Editable": true
                });
                this.headerview.setProperty("/InDate", {
                    ...this.headerFields.InDate,
                    "Editable": true
                });
                this.headerview.setProperty("/InvoicePartyGST", {
                    ...this.headerFields.InvoicePartyGST,
                    "Label": "Vendor GST"
                });
                this.headerview.setProperty("/BillAmount", {
                    ...this.headerFields.BillAmount,
                    "Visible": false
                });
                this.headerview.setProperty("/InvoiceParty", {
                    ...this.headerFields.InvoiceParty,
                    "Required": false,
                    "Label": "Vendor Code"
                });
                this.headerview.setProperty("/InvoicePartyName", {
                    ...this.headerFields.InvoicePartyName,
                    "Visible": true,
                    "Label": "Vendor Name"
                });

                this.lineView.setProperty("/GST", {
                    ...this.currentView.GST,
                    "Visible": true
                });

                if (EntryType === "RGP-IN" || EntryType === "WREF") {
                    this.lineView.setProperty("/InQty", {
                        ...this.currentView.InQty,
                        "Visible": true
                    });
                    this.lineView.setProperty("/DocumentNo", {
                        ...this.currentView.DocumentNo,
                        "Visible": true,
                        "Label": "Out No"
                    });
                    this.lineView.setProperty("/DocumentItemNo", {
                        ...this.currentView.DocumentNo,
                        "Visible": true,
                        "Label": "Out Item"
                    });
                }
                else {
                    this.headerview.setProperty("/ExpectedReturnDate", {
                        ...this.headerFields.ExpectedReturnDate,
                        "Visible": true
                    });
                }
                if (EntryType !== "WREF") {
                    this.lineView.setProperty("/GateQty", {
                        ...this.currentView.GateQty,
                        "Label": "Out Qty"
                    });
                    this.headerview.setProperty("/OutDate", {
                        ...this.headerFields.OutDate,
                        "Visible": true
                    });
                    this.headerview.setProperty("/InDate", {
                        ...this.headerFields.InDate,
                        "Visible": false
                    });
                }
                else {

                    this.lineView.setProperty("/BalQty", {
                        ...this.currentView.BalQty,
                        "Visible": false
                    });
                    this.lineView.setProperty("/GateQty", {
                        ...this.currentView.GateQty,
                        "Visible": false
                    });
                    this.headerview.setProperty("/RefDoc", {
                        ...this.headerFields.RefDoc,
                        "Visible": false
                    });
                    this.lineView.setProperty("/DocumentItemNo", {
                        ...this.currentView.DocumentItemNo,
                        "Visible": false
                    });
                    this.lineView.setProperty("/DocumentNo", {
                        ...this.currentView.DocumentNo,
                        "Visible": false
                    });
                    this.lineView.setProperty("/ProductDesc", {
                        ...this.currentView.ProductDesc,
                        "Editable": true
                    });
                }

                if (EntryType === 'NRGP') {
                    this.lineView.setProperty("/DocumentItemNo", {
                        ...this.currentView.DocumentItemNo,
                        "Visible": false
                    });
                    this.headerview.setProperty("/ExpectedReturnDate", {
                        ...this.headerFields.ExpectedReturnDate,
                        "Visible": false
                    });

                    this.lineView.setProperty("/BalQty", {
                        ...this.currentView.BalQty,
                        "Visible": false
                    });
                    this.headerview.setProperty("/OutDate", {
                        ...this.headerFields.OutDate,
                        "Visible": false
                    });
                    this.headerview.setProperty("/InDate", {
                        ...this.headerFields.InDate,
                        "Visible": true,
                        "Label": "Document Date"
                    });
                }

                if (EntryType === "RGP-IN") {
                    this.headerview.setProperty("/RefDoc", {
                        ...this.headerFields.RefDoc,
                        "Label": "RGP Out No",
                    });
                    this.lineView.setProperty("/GateQty", {
                        ...this.currentView.GateQty,
                        "Editable": false,
                        "Label": "Out Qty"
                    });
                    this.headerview.setProperty("/OutDate", {
                        ...this.headerFields.OutDate,
                        "Visible": false
                    });
                    this.headerview.setProperty("/InDate", {
                        ...this.headerFields.InDate,
                        "Visible": true,
                        "Label": "Document Date"
                    });
                }
                if (EntryType === "RGP-OUT") {
                    this.lineView.setProperty("/DocumentNo", {
                        ...this.currentView.DocumentNo,
                        "Visible": true,
                        "Label": "PO No"
                    });
                    this.lineView.setProperty("/DocumentItemNo", {
                        ...this.currentView.DocumentNo,
                        "Visible": true,
                        "Label": "PO Item"
                    });
                    this.headerview.setProperty("/OutDate", {
                        ...this.headerFields.OutDate,
                        "Visible": false
                    });
                    this.headerview.setProperty("/InDate", {
                        ...this.headerFields.InDate,
                        "Visible": true,
                        "Label": "Document Date"
                    });
                }
                if (EntryType === "NRGP") {
                    this.headerview.setProperty("/RefDoc", {
                        ...this.headerFields.RefDoc,
                        "Visible": false
                    });
                }


                break;

            default:
                break;
        }
    }

    public grosswtChange(oevt: any) {
        this.header.setProperty("/NetWt", oevt.getParameters().value - (this.header.getProperty("/TareWt") || 0));
    }

    public tarewtChange(oevt: any) {
        this.header.setProperty("/NetWt", (this.header.getProperty("/GrossWt") || 0) - oevt.getParameters().value);
    }

    public indicatorChange(oevt: any) {
        let selectedIdx = oevt.getParameters().selectedIndex;
        if (!selectedIdx) {
            (this.byId("_IDGenInput") as Input).setEditable(false);
            (this.byId("_IDGenInput16") as Input).setEditable(false);
        } else {
            (this.byId("_IDGenInput") as Input).setEditable(true);
            (this.byId("_IDGenInput16") as Input).setEditable(true);
        }
    }


    /**-------------------VALUE HELPS--------------------------- */
    public DDialog: ValueHelpDialog;
    public PTCDialog: ValueHelpDialog;
    public _oBasicSearchPTC: any;
    public _oBasicSearchField: any;

    public vhformatter(sOriginalText: string) {
        var sWhitespace = " ",
            sUnicodeWhitespaceCharacter = "\u00A0"; // Non-breaking whitespace

        if (typeof sOriginalText !== "string") {
            return sOriginalText;
        }

        return sOriginalText
            .replaceAll((sWhitespace + sWhitespace), (sWhitespace + sUnicodeWhitespaceCharacter)); // replace spaces
    }

    public onValueChange(oEvent: any) {
        var oInput = oEvent.getSource();
        var sValue = oInput.getValue().toUpperCase();
        oInput.setValue(sValue);
    }

    public _inputTextFormatter(oItem: any) {
        var sOriginalText = oItem.getText(),
            sWhitespace = " ",
            sUnicodeWhitespaceCharacter = "\u00A0"; // Non-breaking whitespace

        if (typeof sOriginalText !== "string") {
            return sOriginalText;
        }

        return sOriginalText
            .replaceAll((sWhitespace + sUnicodeWhitespaceCharacter), (sWhitespace + sWhitespace));
    }

    public handleDValueHelp(oEvent: any) {
        let that = this;
        this._oBasicSearchField = new SearchField({
            search: function () {
                that.DDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "gateentry.view.ValueHelpDialogs.Document"
        }).then(function (oWhitespaceDialog: any) {
            that.DDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName, oColumnDim, oColumnDimName, oColumnParty;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "DocumentNo",
                key: "DocumentNo",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 20
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchField);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("DocumentNo").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                oTable.setSelectionMode("MultiToggle")
                if (oTable.bindRows) {
                    oColumnProductCode = new UIColumn({ label: new Label({ text: "Document No" }), template: new Text({ text: { path: 'DocumentNo' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "DocumentNo"
                    });
                    oTable.addColumn(oColumnProductCode);

                    let oColumnProductName3 = new UIColumn({ label: new Label({ text: "Document Item" }), template: new Text({ wrapping: false, text: "{DocumentItemNo}" }) });
                    oColumnProductName3.data({
                        fieldName: "DocumentItemNo"
                    });
                    oTable.addColumn(oColumnProductName3);

                    oColumnProductName = new UIColumn({ label: new Label({ text: "Material" }), template: new Text({ wrapping: false, text: "{DocumentItem}" }) });
                    oColumnProductName.data({
                        fieldName: "DocumentItem"
                    });
                    oTable.addColumn(oColumnProductName);

                    let oColumnProductName2 = new UIColumn({ label: new Label({ text: "Item Text" }), template: new Text({ wrapping: false, text: "{DocumentItemText}" }) });
                    oColumnProductName2.data({
                        fieldName: "DocumentItemText"
                    });
                    oTable.addColumn(oColumnProductName2);

                    oColumnDim = new UIColumn({ label: new Label({ text: "Entry Type" }), template: new Text({ wrapping: false, text: "{EntryType}" }) });
                    oColumnDim.data({
                        fieldName: "EntryType"
                    });
                    oTable.addColumn(oColumnDim);

                    oColumnDimName = new UIColumn({ label: new Label({ text: "Document Type" }), template: new Text({ wrapping: false, text: "{DocumentType}" }) });
                    oColumnDimName.data({
                        fieldName: "DocumentType"
                    });
                    oTable.addColumn(oColumnDimName);

                    oColumnParty = new UIColumn({ label: new Label({ text: "Invoicing Party" }), template: new Text({ wrapping: false, text: "{InvoicingParty}" }) });
                    oColumnParty.data({
                        fieldName: "InvoicingParty"
                    });
                    oTable.addColumn(oColumnParty);

                    oTable.bindAggregation("rows", {
                        path: "/DocumentVH",
                        filters: [new Filter("EntryType", FilterOperator.EQ, that.header.getProperty("/EntryType"))],
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Document No" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Document Item" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Material" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Item Text" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Entry Type" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Document Type" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Invoicing Party" }) }));
                    oTable.bindItems({
                        path: "/DocumentVH",
                        filters: [new Filter("EntryType", FilterOperator.EQ, that.header.getProperty("/EntryType"))],
                        template: new ColumnListItem({
                            cells: [new Label({ text: "{DocumentNo}" }), new Label({ text: "{DocumentItemNo}" }), new Label({ text: "{DocumentItem}" }), new Label({ text: "{DocumentItemText}" }), new Label({ text: "{EntryType}" }), new Label({ text: "{DocumentType}" }), new Label({ text: "{InvoicingParty}" })]
                        }),
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                oWhitespaceDialog.update();
            }.bind(that));

            // oWhitespaceDialog.setTokens(this._oWhiteSpacesInput.getTokens());
            oWhitespaceDialog.open();
        }.bind(this));

    }

    public onDVHSearchPress(oEvent: any) {
        var sSearchDery = this._oBasicSearchField.getValue(),
            aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult: any, oControl: any) {
            if (oControl.getValue()) {
                aResult.push(new Filter({
                    path: oControl.getName(),
                    operator: FilterOperator.Contains,
                    value1: oControl.getValue()
                }));
            }

            return aResult;
        }, []);

        aFilters.push(new Filter({
            filters: [
                new Filter({ path: "DocumentNo", operator: FilterOperator.Contains, value1: sSearchDery }),
                // new Filter({ path: "DocumentItemNo", operator: FilterOperator.Contains, value1: sSearchDery }),
            ],
            and: false
        }));

        this._filterTableDVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }

    public _filterTableDVH(oFilter: any) {
        var oValueHelpDialog = this.DDialog;
        oValueHelpDialog.getTableAsync().then(function (oTable: any) {
            if (oTable.bindRows) {
                oTable.getBinding("rows").filter(oFilter);
            }
            if (oTable.bindItems) {
                oTable.getBinding("items").filter(oFilter);
            }
            oValueHelpDialog.update();
        });
    }

    public onDVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        let selectedData: any = [];
        BusyIndicator.show();
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
            let text = oToken.getText();
            selectedData.push({
                DocumentItemNo: text.includes("(") ? text.split(" ")[0] : "",
                DocumentNo: text.includes("(") ? oToken.getText().split(" ")[1].replace("(", "").replace(")", "") : text,
                EntryType: that.header.getProperty("/EntryType")
            })
        }.bind(this));

        if (selectedData.length <= 0) return;
        this.oDataModel.read("/DocumentVH", {
            filters: [new Filter({
                filters: selectedData.map((data: any) => {
                    return new Filter({
                        filters: Object.keys(data).map((key: string) => {
                            return new Filter(key, FilterOperator.EQ, data[key])
                        }),
                        and: true,

                    })
                }),
                and: false
            })],
            success: function (response: any) {
                let OProperty = (that.getView() as any).getParent().getParent().getParent().byId("createLines").byId("_IDGenTable1").getModel("Details").getProperty("/OrderDetailsTable") || [];
                let selectedDoc: string[] = [],
                    vendorName = that.header.getProperty("/InvoicePartyName") || "",
                    emptyVend = false;

                for (let index = 0; index < response.results.length; index++) {
                    const object = response.results[index];

                    if (vendorName && response.results[index].InvoicingPartyName !== vendorName && that.header.getProperty("/EntryType") !== 'PUR') {
                        if (!selectedDoc.includes(object.DocumentNo)) selectedDoc.push(object.DocumentNo);
                        continue;
                    }
                    else if (that.selectedVendor && response.results[index].InvoicingPartyName !== that.selectedVendor && that.header.getProperty("/EntryType") === 'PUR') {
                        if (!selectedDoc.includes(object.DocumentNo)) selectedDoc.push(object.DocumentNo);
                        continue;
                    }
                    else if (!vendorName) { vendorName = object.InvoicingPartyName; emptyVend = true; that.selectedVendor = object.InvoicingPartyName; }

                    let obDate = new Date(object.DocumentDate)
                    if (that.lowestDate.toDateString() > obDate.toDateString()) {
                        that.lowestDate = obDate;
                    }


                    OProperty.push({
                        DocumentNo: object.DocumentNo,
                        DocumentItemNo: object.DocumentItemNo,
                        Plant: object.Plant,
                        SLoc: object.StorageLocation,
                        ProductCode: object.DocumentItem,
                        ProductDesc: object.DocumentItemText,
                        PartyCode: object.InvoicingParty,
                        PartyName: object.InvoicingPartyName,
                        GateQty: Number(that.header.getProperty("/EntryType") === "PUR" || that.header.getProperty("/EntryType") === "RGP-OUT" ? 0 : object.DocumentItemQty).toFixed(3),
                        GateValue: Number(object.DocumentItemPrice).toFixed(2),
                        UOM: object.DocumentItemQtyUnit,
                        Rate: Number(object.Rate).toFixed(2),
                        GST: object.GST,
                        OrderQty: Number(object.DocumentItemQty).toFixed(3),
                        BalQty: Number(object.BalQty).toFixed(3),
                        Tolerance: Number(object.ToleranceQty).toFixed(3)
                    })
                    that.matchingPAN = object.InvoicingPartyPAN;
                }
                (that.getView() as any).getParent().getParent().getParent().byId("createLines").byId("_IDGenTable1").getModel("Details").setProperty("/OrderDetailsTable", OProperty);
                (that.byId("EntryType") as any).setEditable(false);
                if (selectedDoc.length > 0) {
                    MessageBox.warning("Vendor Code Mismatch with Documents - " + selectedDoc.join(","));
                    if (!emptyVend) {
                        BusyIndicator.hide();
                        return;
                    }
                }
                if (response.results[0]?.InvoicingParty && that.header.getProperty("/EntryType") !== "PUR") {
                    that.oDataModel.read("/InvoicePartyVH", {
                        filters: [new Filter("InvoicingParty", FilterOperator.EQ, response.results[0].InvoicingParty)],
                        success: function (response: any) {
                            that.header.setProperty("/InvoiceParty", response.results[0].InvoicingParty);
                            that.header.setProperty("/InvoicePartyName", response.results[0].InvoicingPartyName);
                            that.header.setProperty("/InvoicePartyGST", response.results[0].InvoicingPartyGST);
                            if (that.header.getProperty("/EntryType") === "RGP-IN") {
                                that.headerview.setProperty("/InvoiceParty", {
                                    ...that.headerview.getProperty("/InvoiceParty"),
                                    Editable: false
                                })
                                that.headerview.setProperty("/InvoicePartyName", {
                                    ...that.headerview.getProperty("/InvoicePartyName"),
                                    Editable: false
                                })
                            }
                        }
                    })
                }

                BusyIndicator.hide();
            }
        })

        this.DDialog.close();
    }

    public onDVHcancelPress() {
        this.DDialog.close();
    }
    public onDVHAfterClosePress() {
        this.DDialog.destroy();
    }

    public handlePTCValueHelp(oEvent: any) {
        let that = this;
        this._oBasicSearchPTC = new SearchField({
            search: function () {
                that.PTCDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "gateentry.view.ValueHelpDialogs.PartyCode"
        }).then(function (oWhitespaceDialog: any) {
            that.PTCDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName, oColumnProductAlias, oColumnUnitName, oColumnUnit;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "Party Code",
                key: "InvoicingParty",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 7
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchPTC);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("InvoicingParty").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                // oTable.setModel(this.oModel);
                oTable.setSelectionMode("Single")
                if (oTable.bindRows) {
                    oColumnProductCode = new UIColumn({ label: new Label({ text: "Party Code" }), template: new Text({ text: { path: 'InvoicingParty' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "InvoicingParty"
                    });
                    oTable.addColumn(oColumnProductCode);

                    oColumnProductName = new UIColumn({ label: new Label({ text: "Party Name" }), template: new Text({ wrapping: false, text: "{InvoicingPartyName}" }) });
                    oColumnProductName.data({
                        fieldName: "InvoicingPartyName"
                    });
                    oTable.addColumn(oColumnProductName);

                    oColumnUnit = new UIColumn({ label: new Label({ text: "PAN Number" }), template: new Text({ wrapping: false, text: "{InvoicingPartyPAN}" }) });
                    oColumnUnit.data({
                        fieldName: "InvoicingPartyPAN"
                    });
                    oTable.addColumn(oColumnUnit);

                    oColumnUnitName = new UIColumn({ label: new Label({ text: "Tax Number" }), template: new Text({ wrapping: false, text: "{InvoicingPartyGST}" }) });
                    oColumnUnitName.data({
                        fieldName: "InvoicingPartyGST"
                    });
                    oTable.addColumn(oColumnUnitName);

                    if (that.header.getProperty("/EntryType") === "PUR" && that.matchingPAN) {
                        oTable.bindAggregation("rows", {
                            path: "/InvoicePartyVH",
                            filters: [
                                new Filter("InvoicingPartyPAN", FilterOperator.EQ, that.matchingPAN),
                            ],
                            events: {
                                dataReceived: function () {
                                    oWhitespaceDialog.update();
                                }
                            }
                        });
                    }
                    else {
                        oTable.bindAggregation("rows", {
                            path: "/InvoicePartyVH",
                            events: {
                                dataReceived: function () {
                                    oWhitespaceDialog.update();
                                }
                            }
                        });
                    }
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Party Code" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Party Name" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "PAN Number" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Tax Number" }) }));

                    if (that.header.getProperty("/EntryType") === "PUR" && that.matchingPAN) {
                        oTable.bindItems({
                            path: "/InvoicePartyVH",
                            filters: [
                                new Filter("InvoicingPartyPAN", FilterOperator.EQ, that.matchingPAN),
                            ],
                            events: {
                                dataReceived: function () {
                                    oWhitespaceDialog.update();
                                }
                            }
                        });
                    }
                    else {
                        oTable.bindItems({
                            path: "/InvoicePartyVH",
                            events: {
                                dataReceived: function () {
                                    oWhitespaceDialog.update();
                                }
                            }
                        });
                    }


                }

                oTable.attachRowSelectionChange(function (oEVT: any) {
                    let data = oEVT.getParameters().rowContext.getObject();
                    that.header.setProperty("/InvoicePartyGST", data.InvoicingPartyGST);
                    that.header.setProperty("/InvoicePartyName", data.InvoicingPartyName);
                    (that.byId("InvoicePartyName") as any).setEditable(false);
                })

                oWhitespaceDialog.update();
            }.bind(that));

            // oWhitespaceDialog.setTokens(this._oWhiteSpacesInput.getTokens());
            oWhitespaceDialog.open();
        }.bind(this));

    }

    public onPTCVHSearchPress(oEvent: any) {
        var sSearchQuery = this._oBasicSearchPTC.getValue(),
            aSelectionSet = oEvent.getParameter("selectionSet");

        var aFilters = aSelectionSet.reduce(function (aResult: any, oControl: any) {
            if (oControl.getValue()) {
                aResult.push(new Filter({
                    path: oControl.getName(),
                    operator: FilterOperator.Contains,
                    value1: oControl.getValue()
                }));
            }

            return aResult;
        }, []);

        aFilters.push(new Filter({
            filters: [
                new Filter({ path: "InvoicingParty", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "InvoicingPartyName", operator: FilterOperator.Contains, value1: sSearchQuery }),
            ],
            and: false
        }));

        this._filterTablePTCVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }

    public _filterTablePTCVH(oFilter: any) {
        var oValueHelpDialog = this.PTCDialog;
        oValueHelpDialog.getTableAsync().then(function (oTable: any) {
            if (oTable.bindRows) {
                oTable.getBinding("rows").filter(oFilter);
            }
            if (oTable.bindItems) {
                oTable.getBinding("items").filter(oFilter);
            }
            oValueHelpDialog.update();
        });
    }

    public onPTCVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
        }.bind(this));
        this.header.setProperty("/InvoiceParty", aTokens[0].mProperties.key)
        // OProperty[this.valueHelpLineIndex as number].PartyName = aTokens[0].mProperties.text.split(" (")[0];
        this.PTCDialog.close();
    }

    public onSuggestionItemSelectedPTC(oEvt: any) {
        let description = oEvt.getParameters().selectedRow.getCells()[3].getText(),
            name = oEvt.getParameters().selectedRow.getCells()[0].getText(),
            name2 = oEvt.getParameters().selectedRow.getCells()[1].getText();
        this.header.setProperty("/InvoiceParty", name);
        this.header.setProperty("/InvoicePartyName", name2);
        this.header.setProperty("/InvoicePartyGST", description);
    }

    public onPTCVHcancelPress() {

        this.PTCDialog.close();
    }
    public onPTCVHAfterClosePress() {

        this.PTCDialog.destroy();
    }
}