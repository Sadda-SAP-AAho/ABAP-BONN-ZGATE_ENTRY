
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";

/**Value Helps */
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import SearchField from "sap/m/SearchField";
import TypeString from 'sap/ui/model/type/String'
import Label from "sap/m/Label";
import UIColumn from "sap/ui/table/Column";
import MColumn from "sap/m/Column";
import Text from "sap/m/Text";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageBox from "sap/m/MessageBox";


export default class AddLines extends Controller {

    public oDataModel: ODataModel;
    public line = new JSONModel();
    public view = new JSONModel();

    public EmptySalesLine = {
        "Plant": "",
        "SLoc": "",
        "PartyCode": "",
        "PartyName": "",
        "ProductCode": "",
        "ProductDesc": "",
        "DocumentNo": "",
        "DocumentItemNo": "",
        "DocumentQty": 0.00,
        "UOM": "",
        "GateQty": 0.00,
        "BalQty": 0.00,
        "GateValue": 0.00,
        "Remarks": "",
        "Rate": 0.00,
        "OrderQty": 0.00,
    }

    public fieldsEnabled = {
        "DocumentNo": { "Label": "PO No", Visible: true },
        "DocumentItemNo": { "Label": "PO Item", Visible: true },
        "Plant": { "Editable": false, "Label": "Plant", Visible: true },
        "SLoc": { "Editable": false, "Label": "Storage Location", Visible: false },
        "ProductCode": { "Editable": false, "Label": "Product Code", Visible: true },
        "ProductDesc": { "Label": "Product Description", Visible: true },
        "PartyCode": { "Editable": false, "Label": "Party Code", Visible: true },
        "PartyName": { "Label": "Party Name", Visible: true },
        "GateQty": { "Editable": true, "Label": "Gate Qty", Visible: true },
        "InQty": { "Editable": true, "Label": "In Qty", Visible: false },
        "Rate": { "Editable": false, "Label": "Rate", Visible: true },
        "GateValue": { "Editable": false, "Label": "Gate Value", Visible: true },
        "BalQty": { "Editable": false, "Label": "Balance Qty", Visible: true },
        "UOM": { "Editable": false, "Label": "UOM", Visible: true },
        "GST": { "Editable": true, "Label": "GST %", Visible: true },
        "Remarks": { "Editable": true, "Label": "Remarks", Visible: true },
    }

    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("GateEntryCreate").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(): void {
        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY/");
        (this.byId("_IDGenTable1") as any).setModel(this.line, "Details");
        this.line.setProperty("/OrderDetailsTable", []);
        (this.byId("_IDGenTable1") as any).setModel(this.view, "View");
        let ownerModelSettings = new JSONModel();
        this.getOwnerComponent()?.setModel(ownerModelSettings, "LinesSettings");
        ownerModelSettings.setProperty("/", { ...this.fieldsEnabled });
        this.view.setProperty("/", { ...this.fieldsEnabled });

    }

    public deleteLine() {
        let selectedIndex = (this.byId("_IDGenTable1") as any).getSelectedIndices();
        this.line.setProperty("/OrderDetailsTable", this.line.getProperty("/OrderDetailsTable").filter((data: any, index: number) => !selectedIndex.includes(index)));
        if (this.line.getProperty("/OrderDetailsTable") && this.line.getProperty("/OrderDetailsTable").length <= 0) {
            let form = (this.getView() as any).getParent().getParent().getParent().byId("createHeaderForm");
            form.byId("EntryType").setEditable(true);
            form.byId("InvoiceParty").setValue("")
            form.byId("InvoicePartyName").setValue("");
            form.byId("_IDGenInput6").setValue("");
        }
    }

    public checkEntryTypeAdded() {
        let EntryType = (this.getView() as any).getParent().getParent().getParent().byId("createHeaderForm").byId("EntryType").getValue();
        if (!EntryType) {
            MessageBox.error("Entry Type not Selected.");
            return false;
        }
        return true;
    }

    public addLine(): void {
        if (!this.checkEntryTypeAdded()) return;
        let OProperty = this.line.getProperty("/OrderDetailsTable");
        let formData = (this.getView() as any).getParent().getParent().getParent().byId("createHeaderForm").byId("EntryHeader").getModel("Header").getProperty("/")
        if (!OProperty) OProperty = [];
        OProperty.push({
            ...this.EmptySalesLine,
            LineNum: OProperty.length,
            PartyCode: formData.InvoiceParty || "",
            PartyName: formData.InvoicePartyName || "",
        })

        this.line.setProperty("/OrderDetailsTable", OProperty);
        (this.getView() as any).getParent().getParent().getParent().byId("createHeaderForm").byId("EntryType").setEditable(false);

    }

    public gateQtyChange(oEvt: any) {
        let index = oEvt.getSource().getParent().getIndex();
        let currentLines = this.line.getProperty("/OrderDetailsTable");

        let tol = 0
        if(currentLines[index].Tolerance){
            tol = parseFloat(currentLines[index].BalQty) + parseFloat(currentLines[index].Tolerance) 
        }

        if ((parseFloat(currentLines[index].GateQty) !== 0 && parseFloat(currentLines[index].GateQty) > tol && currentLines[index].DocumentNo) ) {
            MessageBox.error("Gate Qty Greater than Balance Qty.");
            currentLines[index].GateQty = 0;
            this.line.setProperty("/OrderDetailsTable", currentLines);
            return;
        }
        currentLines[index].GateValue = currentLines[index].GateQty * currentLines[index].Rate;
        this.line.setProperty("/OrderDetailsTable", currentLines);
        oEvt.getSource().setValue(Number(currentLines[index].GateQty).toFixed(3));
    }

    public InQtyChange(oEvt: any) {
        let index = oEvt.getSource().getParent().getIndex(),
            currentLines = this.line.getProperty("/OrderDetailsTable"),
            EntryType = (this.getView() as any).getParent().getParent().getParent().byId("createHeaderForm").byId("EntryType").getValue();
        if (EntryType !== "RGP-IN" && EntryType !== "WREF") return;
        if (parseFloat(currentLines[index].InQty) > parseFloat(currentLines[index].BalQty) && EntryType === "RGP-IN") {
            MessageBox.error("In Qty cannot be greater than Balance Qty");
            currentLines[index].InQty = 0;
            this.line.setProperty("/OrderDetailsTable", currentLines);
            return;
        }
        // if (parseFloat(currentLines[index].InQty) > parseFloat(currentLines[index].GateQty) && EntryType !== "WREF") {
        //     MessageBox.error("In Qty cannot be greater than Out Qty");
        //     currentLines[index].InQty = 0;
        //     this.line.setProperty("/OrderDetailsTable", currentLines);
        //     return;
        // }
        currentLines[index].GateValue = currentLines[index].InQty * (currentLines[index].Rate || 0);
        this.line.setProperty("/OrderDetailsTable", currentLines);
        oEvt.getSource().setValue(Number(currentLines[index].InQty).toFixed(3));
    }

    public rateChange(oEvt: any) {
        let index = oEvt.getSource().getParent().getIndex(),
            currentLines = this.line.getProperty("/OrderDetailsTable"),
            EntryType = (this.getView() as any).getParent().getParent().getParent().byId("createHeaderForm").byId("EntryType").getValue();

        if (EntryType === "RGP-IN" || EntryType === "WREF") currentLines[index].GateValue = (currentLines[index].InQty || 0) * currentLines[index].Rate;
        else currentLines[index].GateValue = currentLines[index].GateQty * currentLines[index].Rate;
        this.line.setProperty("/OrderDetailsTable", currentLines);
    }









    /**-------------------VALUE HELPS--------------------------- */
    public QUDialog: ValueHelpDialog;
    public bulkrsDialog: ValueHelpDialog;
    public plantDialog: ValueHelpDialog;
    public PTCDialog: ValueHelpDialog;
    public _oBasicSearchField: any;
    public _oBasicSearchPC: any;
    public _oBasicSearchPlant: any;
    public _oBasicSearchPTC: any;
    public valueHelpLineIndex: number | null = null;

    public vhformatter(sOriginalText: string) {
        var sWhitespace = " ",
            sUnicodeWhitespaceCharacter = "\u00A0"; // Non-breaking whitespace

        if (typeof sOriginalText !== "string") {
            return sOriginalText;
        }

        return sOriginalText
            .replaceAll((sWhitespace + sWhitespace), (sWhitespace + sUnicodeWhitespaceCharacter)); // replace spaces
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

    public handleQUValueHelp(oEvent: any) {
        let that = this;
        this.valueHelpLineIndex = oEvent.getSource().getParent().getIndex();
        this._oBasicSearchField = new SearchField({
            search: function () {
                that.QUDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "gateentry.view.ValueHelpDialogs.QuantityUnit"
        }).then(function (oWhitespaceDialog: any) {
            that.QUDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName, oColumnDim, oColumnDimName;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "UnitOfMeasure",
                key: "UnitOfMeasure",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 7
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchField);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("UnitOfMeasure").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                // oTable.setModel(this.oModel);
                oTable.setSelectionMode("Single")
                if (oTable.bindRows) {
                    oColumnProductCode = new UIColumn({ label: new Label({ text: "UnitOfMeasure" }), template: new Text({ text: { path: 'UnitOfMeasure' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "Unit Of Measure"
                    });
                    oTable.addColumn(oColumnProductCode);

                    oColumnProductName = new UIColumn({ label: new Label({ text: "Meas. Unit Text" }), template: new Text({ wrapping: false, text: "{UnitOfMeasure_Text}" }) });
                    oColumnProductName.data({
                        fieldName: "UnitOfMeasureLongName"
                    });
                    oTable.addColumn(oColumnProductName);

                    oColumnDim = new UIColumn({ label: new Label({ text: "Dimension" }), template: new Text({ wrapping: false, text: "{UnitOfMeasureDimension}" }) });
                    oColumnDim.data({
                        fieldName: "UnitOfMeasureDimension"
                    });
                    oTable.addColumn(oColumnDim);

                    // oColumnDimName = new UIColumn({ label: new Label({ text: "Dimension Name" }), template: new Text({ wrapping: false, text: "{UnitOfMeasureDimensionName}" }) });
                    // oColumnDimName.data({
                    //     fieldName: "UnitOfMeasureDimensionName"
                    // });
                    // oTable.addColumn(oColumnDimName);

                    oTable.bindAggregation("rows", {
                        path: "/UnitOfMeasure",
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Unit Of Measure" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Meas. Unit Text" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Dimension" }) }));
                    // oTable.addColumn(new MColumn({ header: new Label({ text: "Dimension Name" }) }));
                    oTable.bindItems({
                        // templateShareable: false,
                        path: "/UnitOfMeasure",
                        // template: new ColumnListItem({
                        //     cells: [new Label({ text: "{UnitOfMeasure}" }), new Label({ text: "{UnitOfMeasure_Text}" }), new Label({ text: "{UnitOfMeasureDimension}" })]
                        //     // cells: [new Label({ text: "{UnitOfMeasure}" }), new Label({ text: "{UnitOfMeasureLongName}" }), new Label({ text: "{UnitOfMeasureDimension}" }), new Label({ text: "{UnitOfMeasureDimensionName}" })]
                        // }),
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        },
                    });
                }

                oWhitespaceDialog.update();
            }.bind(that));

            // oWhitespaceDialog.setTokens(this._oWhiteSpacesInput.getTokens());
            oWhitespaceDialog.open();
        }.bind(this));

    }

    public onQUVHSearchPress(oEvent: any) {
        var sSearchQuery = this._oBasicSearchField.getValue(),
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
                new Filter({ path: "UnitOfMeasure", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "UnitOfMeasure_Text", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "UnitOfMeasureDimension", operator: FilterOperator.Contains, value1: sSearchQuery }),
                // new Filter({ path: "UnitOfMeasureDimensionName", operator: FilterOperator.Contains, value1: sSearchQuery })
            ],
            and: false
        }));

        this._filterTableQUVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }

    public _filterTableQUVH(oFilter: any) {
        var oValueHelpDialog = this.QUDialog;
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

    public onQUVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
        }.bind(this));
        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[this.valueHelpLineIndex as number].UOM = aTokens[0].mProperties.key;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.QUDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedQU(oEvt: any) {
        let name = oEvt.getParameters().selectedRow.getCells()[0].getText(),
            OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[oEvt.getSource().getParent().getIndex()].UOM = name;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.valueHelpLineIndex = null;
    }

    public onQUVHcancelPress() {
        this.QUDialog.close();
        this.valueHelpLineIndex = null;
    }
    public onQUVHAfterClosePress() {
        this.QUDialog.destroy();
        this.valueHelpLineIndex = null;
    }

    public handlePCValueHelp(oEvent: any) {
        let that = this;
        this.valueHelpLineIndex = oEvent.getSource().getParent().getIndex();
        this._oBasicSearchPC = new SearchField({
            search: function () {
                that.bulkrsDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "gateentry.view.ValueHelpDialogs.ProductCode"
        }).then(function (oWhitespaceDialog: any) {
            that.bulkrsDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName, oColumnProductAlias, oColumnUnitName, oColumnUnit;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "Product",
                key: "Product",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 7
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchPC);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("Product").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                // oTable.setModel(this.oModel);
                oTable.setSelectionMode("Single")
                if (oTable.bindRows) {
                    oColumnProductCode = new UIColumn({ label: new Label({ text: "Product" }), template: new Text({ text: { path: 'Product' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "Product"
                    });
                    oTable.addColumn(oColumnProductCode);

                    oColumnProductName = new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{ProductDescription}" }) });
                    oColumnProductName.data({
                        fieldName: "ProductDescription"
                    });
                    oTable.addColumn(oColumnProductName);

                    oColumnUnit = new UIColumn({ label: new Label({ text: "Unit" }), template: new Text({ wrapping: false, text: "{BaseUnit}" }) });
                    oColumnUnit.data({
                        fieldName: "BaseUnit"
                    });
                    oTable.addColumn(oColumnUnit);

                    oColumnUnitName = new UIColumn({ label: new Label({ text: "Unit Name" }), template: new Text({ wrapping: false, text: "{UnitOfMeasureLongName}" }) });
                    oColumnUnitName.data({
                        fieldName: "UnitOfMeasureLongName"
                    });
                    oTable.addColumn(oColumnUnitName);
                    oTable.bindAggregation("rows", {
                        path: "/ProductStdVH",
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Product" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "ProductDescription" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "BaseUnit" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "UnitOfMeasureLongName" }) }));
                    oTable.bindItems({
                        path: "/ProductStdVH",
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                oTable.attachRowSelectionChange(function (oEVT: any) {
                    let data = oEVT.getParameters().rowContext.getObject();
                    let OProperty = that.line.getProperty("/OrderDetailsTable");
                    if (that.valueHelpLineIndex !== null) {
                        OProperty[that.valueHelpLineIndex].UOM = data.BaseUnit;
                        OProperty[that.valueHelpLineIndex].ProductDesc = data.ProductDescription;
                    }
                    that.line.setProperty("/OrderDetailsTable", OProperty);
                })

                oWhitespaceDialog.update();
            }.bind(that));

            // oWhitespaceDialog.setTokens(this._oWhiteSpacesInput.getTokens());
            oWhitespaceDialog.open();
        }.bind(this));

    }

    public onPCVHSearchPress(oEvent: any) {
        var sSearchQuery = this._oBasicSearchPC.getValue(),
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
                new Filter({ path: "Product", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "ProductDescription", operator: FilterOperator.Contains, value1: sSearchQuery }),
            ],
            and: false
        }));

        this._filterTablePCVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }

    public _filterTablePCVH(oFilter: any) {
        var oValueHelpDialog = this.bulkrsDialog;
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

    public onPCVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
        }.bind(this));
        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[this.valueHelpLineIndex as number].ProductCode = aTokens[0].mProperties.key;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.bulkrsDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedPC(oEvt: any) {
        let description = oEvt.getParameters().selectedRow.getCells()[1].getText(),
            name = oEvt.getParameters().selectedRow.getCells()[0].getText(),
            uom = oEvt.getParameters().selectedRow.getCells()[2].getText();

        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[oEvt.getSource().getParent().getIndex()].ProductCode = name;
        OProperty[oEvt.getSource().getParent().getIndex()].ProductDesc = description;
        OProperty[oEvt.getSource().getParent().getIndex()].UOM = uom;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.valueHelpLineIndex = null;
    }

    public onPCVHcancelPress() {
        this.valueHelpLineIndex = null;
        this.bulkrsDialog.close();
    }
    public onPCVHAfterClosePress() {
        this.valueHelpLineIndex = null;
        this.bulkrsDialog.destroy();
    }

    public handlePlantValueHelp(oEvent: any) {
        let that = this;
        this.valueHelpLineIndex = oEvent.getSource().getParent().getIndex();
        this._oBasicSearchPlant = new SearchField({
            search: function () {
                that.plantDialog.getFilterBar().search();
            }.bind(this)
        });
        this.loadFragment({
            name: "gateentry.view.ValueHelpDialogs.Plant"
        }).then(function (oWhitespaceDialog: any) {
            that.plantDialog = oWhitespaceDialog;
            var oFilterBar = oWhitespaceDialog.getFilterBar(), oColumnProductCode, oColumnProductName, oColumnProductAlias, oColumnUnitName, oColumnUnit;

            that.getView()?.addDependent(oWhitespaceDialog);

            // Set key fields for filtering in the Define Conditions Tab
            oWhitespaceDialog.setRangeKeyFields([{
                label: "Plant",
                key: "Plant",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 7
                })
            }]);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchPlant);

            // Re-map whitespaces
            oFilterBar.determineFilterItemByName("Plant").getControl().setTextFormatter(that._inputTextFormatter);

            oWhitespaceDialog.getTableAsync().then(function (oTable: any) {
                // oTable.setModel(this.oModel);
                oTable.setSelectionMode("Single")
                if (oTable.bindRows) {
                    oColumnProductCode = new UIColumn({ label: new Label({ text: "Plant" }), template: new Text({ text: { path: 'Plant' }, renderWhitespace: true }) });
                    oColumnProductCode.data({
                        fieldName: "Plant"
                    });
                    oTable.addColumn(oColumnProductCode);

                    oColumnProductName = new UIColumn({ label: new Label({ text: "Name" }), template: new Text({ wrapping: false, text: "{PlantName}" }) });
                    oColumnProductName.data({
                        fieldName: "PlantName"
                    });
                    oTable.addColumn(oColumnProductName);


                    oTable.bindAggregation("rows", {
                        path: "/Plant",
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Plant" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Name" }) }));
                    oTable.bindItems({
                        path: "/Plant",
                        // templateShareable: false,
                        // template: new ColumnListItem({
                        //     cells: [new Label({ text: "{Plant}" }), new Label({ text: "{PlantName}" })]
                        // }),
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }
                oWhitespaceDialog.update();
            }.bind(that));

            oWhitespaceDialog.open();
        }.bind(this));

    }

    public onPlantVHSearchPress(oEvent: any) {
        var sSearchQuery = this._oBasicSearchPlant.getValue(),
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
                new Filter({ path: "Plant", operator: FilterOperator.Contains, value1: sSearchQuery }),
                new Filter({ path: "PlantName", operator: FilterOperator.Contains, value1: sSearchQuery }),
            ],
            and: false
        }));

        this._filterTablePlantVH(new Filter({
            filters: aFilters,
            and: true
        }));
    }

    public _filterTablePlantVH(oFilter: any) {
        var oValueHelpDialog = this.plantDialog;
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

    public onPlantVHokPress(oEvent: any) {
        let that = this;
        var aTokens = oEvent.getParameter("tokens");
        aTokens.forEach(function (oToken: any) {
            oToken.setText(that.vhformatter(oToken.getText()));
        }.bind(this));

        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[this.valueHelpLineIndex as number].Plant = aTokens[0].mProperties.key;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.plantDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedPlant(oEvt: any) {
        let name = oEvt.getParameters().selectedRow.getCells()[0].getText();
        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[oEvt.getSource().getParent().getIndex()].Plant = name;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.valueHelpLineIndex = null;
    }

    public onPlantVHcancelPress() {
        this.valueHelpLineIndex = null;
        this.plantDialog.close();
    }
    public onPlantVHAfterClosePress() {
        this.valueHelpLineIndex = null;
        this.plantDialog.destroy();
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
                    oTable.bindAggregation("rows", {
                        path: "/InvoicePartyVH",
                        // filters: [new Filter("EntryType", FilterOperator.EQ, that.header.getProperty("/EntryType"))],
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // For Mobile the default table is sap.m.Table
                if (oTable.bindItems) {
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Party Code" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Party Name" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "PAN Number" }) }));
                    oTable.addColumn(new MColumn({ header: new Label({ text: "Tax Number" }) }));
                    oTable.bindItems({
                        path: "/InvoicePartyVH",
                        // filters: [new Filter("EntryType", FilterOperator.EQ, that.header.getProperty("/EntryType"))],
                        // templateShareable: false,
                        // template: new ColumnListItem({
                        //     cells: [new Label({ text: "{Supplier}" }), new Label({ text: "{SupplierName}" })]
                        //     // cells: [new Label({ text: "{Product}" }), new Label({ text: "{Product_Text}" }), new Label({ text: "{Product_Text}" })]
                        // }),
                        events: {
                            dataReceived: function () {
                                oWhitespaceDialog.update();
                            }
                        }
                    });
                }

                // oTable.attachRowSelectionChange(function (oEVT: any) {
                //     let data = oEVT.getParameters().rowContext.getObject();
                //     that.header.setProperty("/InvoicePartyGST", data.InvoicingPartyGST);
                // })

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
        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[this.valueHelpLineIndex as number].PartyCode = aTokens[0].mProperties.key;
        OProperty[this.valueHelpLineIndex as number].PartyName = aTokens[0].mProperties.text.split(" (")[0];
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.PTCDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedPTC(oEvt: any) {
        let description = oEvt.getParameters().selectedRow.getCells()[1].getText(),
            name = oEvt.getParameters().selectedRow.getCells()[0].getText();

        let OProperty = this.line.getProperty("/OrderDetailsTable");
        OProperty[oEvt.getSource().getParent().getIndex()].PartyCode = name;
        OProperty[oEvt.getSource().getParent().getIndex()].PartyName = description;
        this.line.setProperty("/OrderDetailsTable", OProperty);
        this.valueHelpLineIndex = null;
    }

    public onPTCVHcancelPress() {
        this.valueHelpLineIndex = null;
        this.PTCDialog.close();
    }
    public onPTCVHAfterClosePress() {
        this.valueHelpLineIndex = null;
        this.PTCDialog.destroy();
    }

}


