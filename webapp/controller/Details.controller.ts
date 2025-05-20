import BusyIndicator from "sap/ui/core/BusyIndicator";
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import UpdateMethod from "sap/ui/model/odata/UpdateMethod";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import MessageItem from "sap/m/MessageItem";
import ElementRegistry from "sap/ui/core/ElementRegistry";
import MessagePopover from "sap/m/MessagePopover";
import SmartForm from "sap/ui/comp/smartform/SmartForm";
import Button from "sap/m/Button";
import Page from "sap/m/Page";
import ManagedObject from "sap/ui/base/ManagedObject";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageBox from "sap/m/MessageBox";
import TypeString from 'sap/ui/model/type/String'
import MColumn from "sap/m/Column"
import UIColumn from "sap/ui/table/Column"
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import SearchField from "sap/m/SearchField";
import Label from "sap/m/Label";
import Text from "sap/m/Text";
import ColumnListItem from "sap/m/ColumnListItem";

export default class Details extends Controller {


    public oDataModel: ODataModel;
    public lines: JSONModel;
    public _MessageManager = Messaging;
    public oMP: any;
    public gateEntry: any = {};
    public selectedLines: string[] = [];
    public selectedVendor: string = "";
    public removedLines: any = []

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
        "DocumentNo": { "Editable": false, "Label": "PO No", Visible: true },
        "DocumentItemNo": { "Editable": false, "Label": "PO Item", Visible: true },
        "Plant": { "Editable": false, "Label": "Plant", Visible: true },
        "SLoc": { "Editable": false, "Label": "Storage Location", Visible: false },
        "ProductCode": { "Editable": false, "Label": "Product Code", Visible: true },
        "ProductDesc": { "Editable": false, "Label": "Product Description", Visible: true },
        "PartyCode": { "Editable": false, "Label": "Party Code", Visible: true },
        "PartyName": { "Editable": false, "Label": "Party Name", Visible: true },
        "GateQty": { "Editable": false, "Label": "Gate Qty", Visible: true },
        "InQty": { "Editable": false, "Label": "In Qty", Visible: false },
        "Rate": { "Editable": false, "Label": "Rate", Visible: true },
        "GateValue": { "Editable": false, "Label": "Gate Value", Visible: true },
        "BalQty": { "Editable": false, "Label": "Balance Qty", Visible: true },
        "UOM": { "Editable": false, "Label": "UOM", Visible: true },
        "GST": { "Editable": false, "Label": "GST %", Visible: true },
        "Remarks": { "Editable": false, "Label": "Remarks", Visible: true },
    }


    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("GateEntryDetails").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(oEvent: any): void {

        BusyIndicator.show();
        let avcLic = window.decodeURIComponent((<any>oEvent.getParameter("arguments")).GateEntry);

        this.gateEntry = {
            Gateentryno: avcLic.split("'")[1],
            full: avcLic
        }

        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY", {
            defaultCountMode: "None",
            defaultUpdateMethod: UpdateMethod.Merge,
        });
        // this.oDataModel.setDefaultBindingMode("TwoWay");
        this.getView()!.setModel(this.oDataModel);


        var that = this;
        this.oDataModel.getMetaModel().loaded().then(function () {
            that.byId("smartForm")!.bindElement(that.gateEntry.full);
            // (that.byId("_IDGenSmartTable2") as SmartTable).bindElement("/GateEntryLines");
        });
        // (that.byId("_IDGenSmartTable2") as SmartTable).rebindTable(true);

        this.lines = new JSONModel();
        this.byId("_IDGenTable1")?.setModel(this.lines);
        this.lines.setProperty("/View", this.fieldsEnabled);


        this.oDataModel.read("/GateEntryLines", {
            filters: [new Filter("GateEntryNo", FilterOperator.EQ, this.gateEntry.Gateentryno)],
            success: function (data: any) {
                that.lines.setProperty("/EntryLines", data.results);
            },
            error: function (error: any) {
                MessageBox.error("Error Loadnig Lines");
            }
        })

        this.oDataModel.attachRequestCompleted(function (data: any) {
            let reqDetails = data.getParameters();
            if (reqDetails.url === `GateEntryHeader('${that.gateEntry.Gateentryno}')` && reqDetails.method === 'GET' && !reqDetails.url.includes("EntryLines")) {
                that.gateEntry["Header"] = JSON.parse(data.getParameters().response.responseText).d;
                that.setLinesSettings(that.gateEntry["Header"].EntryType);
            }
        })

        this.cancelDisable();
        this._MessageManager.removeAllMessages();

        this._MessageManager.registerObject(this.byId("smartForm") as ManagedObject, true);
        this.getView()!.setModel(this._MessageManager.getMessageModel(), "message");
        this.createMessagePopover();
        BusyIndicator.hide();

    }

    public setLinesSettings(EntryType: string) {

        switch (EntryType) {
            case "PUR":
                break;
            case "RGP-IN":
            case "RGP-OUT":
            case "WREF":
            case "NRGP":
                this.lines.setProperty("/View/PartyCode", {
                    ...this.fieldsEnabled.PartyCode,
                    "Visible": false
                });
                this.lines.setProperty("/View/SLoc", {
                    ...this.fieldsEnabled.SLoc,
                    "Visible": false
                });
                this.lines.setProperty("/View/UOM", {
                    ...this.fieldsEnabled.UOM,
                    "Editable": true
                });
                this.lines.setProperty("/View/Rate", {
                    ...this.fieldsEnabled.Rate,
                    "Editable": true
                });
                this.lines.setProperty("/View/DocumentNo", {
                    ...this.fieldsEnabled.DocumentNo,
                    "Visible": false
                });
                this.lines.setProperty("/View/PartyName", {
                    ...this.fieldsEnabled.PartyName,
                    "Visible": false
                });
                this.lines.setProperty("/View/GateValue", {
                    ...this.fieldsEnabled.GateValue,
                    "Label": "Amount"
                });
                this.lines.setProperty("/View/Remarks", {
                    ...this.fieldsEnabled.Remarks,
                    "Label": "Purpose"
                });
                this.lines.setProperty("/View/Plant", {
                    ...this.fieldsEnabled.Plant,
                    "Editable": true
                });
                this.lines.setProperty("/View/ProductCode", {
                    ...this.fieldsEnabled.ProductCode,
                    "Editable": true
                });

                this.lines.setProperty("/View/GST", {
                    ...this.fieldsEnabled.GST,
                    "Visible": true
                });

                if (EntryType === "RGP-IN" || EntryType === "WREF") {
                    this.lines.setProperty("/View/InQty", {
                        ...this.fieldsEnabled.InQty,
                        "Visible": true
                    });
                    this.lines.setProperty("/View/DocumentNo", {
                        ...this.fieldsEnabled.DocumentNo,
                        "Visible": true,
                        "Label": "Out No"
                    });
                    this.lines.setProperty("/View/DocumentItemNo", {
                        ...this.fieldsEnabled.DocumentNo,
                        "Visible": true,
                        "Label": "Out Item"
                    });
                }

                if (EntryType !== "WREF") {
                    this.lines.setProperty("/View/GateQty", {
                        ...this.fieldsEnabled.GateQty,
                        "Label": "Out Qty"
                    });
                }
                else {

                    this.lines.setProperty("/View/BalQty", {
                        ...this.fieldsEnabled.BalQty,
                        "Visible": false
                    });
                    this.lines.setProperty("/View/GateQty", {
                        ...this.fieldsEnabled.GateQty,
                        "Visible": false
                    });

                    this.lines.setProperty("/View/DocumentItemNo", {
                        ...this.fieldsEnabled.DocumentItemNo,
                        "Visible": false
                    });
                    this.lines.setProperty("/View/DocumentNo", {
                        ...this.fieldsEnabled.DocumentNo,
                        "Visible": false
                    });
                    this.lines.setProperty("/View/ProductDesc", {
                        ...this.fieldsEnabled.ProductDesc,
                        "Editable": true
                    });
                }

                if (EntryType === 'NRGP') {
                    this.lines.setProperty("/View/DocumentItemNo", {
                        ...this.fieldsEnabled.DocumentItemNo,
                        "Visible": false
                    });

                    this.lines.setProperty("/View/BalQty", {
                        ...this.fieldsEnabled.BalQty,
                        "Visible": false
                    });
                }

                if (EntryType === "RGP-IN") {

                    this.lines.setProperty("/View/GateQty", {
                        ...this.fieldsEnabled.GateQty,
                        "Editable": false,
                        "Label": "Out Qty"
                    });
                }
                if (EntryType === "RGP-OUT") {
                    this.lines.setProperty("/View/DocumentNo", {
                        ...this.fieldsEnabled.DocumentNo,
                        "Visible": true,
                        "Label": "PO No"
                    });
                    this.lines.setProperty("/View/DocumentItemNo", {
                        ...this.fieldsEnabled.DocumentNo,
                        "Visible": true,
                        "Label": "PO Item"
                    });
                }

                break;

            default:
                break;
        }

    }

    public onBeforeRebindTable(e: any): void {
        var b = e.getParameter("bindingParams"), aDateFilters = [];
        aDateFilters.push(new Filter("GateEntryNo", FilterOperator.EQ, this.gateEntry.Gateentryno))
        var oOwnMultiFilter = new Filter(aDateFilters, true);
        if (b.filters[0] && b.filters[0].aFilters) {
            var oSmartTableMultiFilter = b.filters[0];
            b.filters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
        } else {
            b.filters.push(oOwnMultiFilter);
        }
    }


    public editEnable() {
        let that = this;
        this._MessageManager.removeAllMessages();
        (this.byId("Update") as Button).setVisible(false);
        (this.byId("_IDGenPage4") as Page).setShowFooter(true);
        (this.byId("RemoveLine") as Button).setVisible(true);
        (this.byId("AddLine") as Button).setVisible(true);

        let settings: any = Object.keys(this.lines.getProperty("/View"));
        if (settings) {
            settings.forEach((data: any) => {
                that.lines.setProperty("/View/" + data + "/Editable", true);
                return;
            })
        }


        (this.byId("smartForm") as SmartForm).setEditable(true);
        if ((this.oDataModel as any).oData[`GateEntryHeader('${this.gateEntry.Gateentryno}')`].UpdateAllowed) {
            // (this.byId("_IDGenSmartTable2") as SmartTable).setEditable(true);
        }
    }

    public deleteLine() {
        let selectedIndex = (this.byId("_IDGenTable1") as any).getSelectedIndices();
        let removedData = this.lines.getProperty("/EntryLines").filter((data: any, index: number) => selectedIndex.includes(index));
        this.removedLines.push(...removedData);
        this.lines.setProperty("/EntryLines", this.lines.getProperty("/EntryLines").filter((data: any, index: number) => !selectedIndex.includes(index)));
    }


    public addLine(): void {
        let OProperty = this.lines.getProperty("/EntryLines");
        if (!OProperty) OProperty = [];
        OProperty.push({
            ...this.EmptySalesLine,
            LineNum: OProperty.length,
            new: true,
            PartyCode: this.gateEntry["Header"].InvoiceParty || "",
            PartyName: this.gateEntry["Header"].InvoicePartyName || "",
        })

        this.lines.setProperty("/EntryLines", OProperty);
    }


    public cancelDisable() {
        let that = this;
        this._MessageManager.removeAllMessages();
        (this.byId("Update") as Button).setVisible(true);
        (this.byId("_IDGenPage4") as Page).setShowFooter(false);
        (this.byId("RemoveLine") as Button).setVisible(false);
        (this.byId("AddLine") as Button).setVisible(false);


        let settings: any = Object.keys(this.lines.getProperty("/View"));
        if (settings.length > 0) {
            settings.forEach((data: any) => {
                that.lines.setProperty("/View/" + data + "/Editable", false);
                return;
            })
        }

        (this.byId("smartForm") as SmartForm).setEditable(false);
        // (this.byId("_IDGenSmartTable2") as SmartTable).setEditable(false);
    }


    public onSelectionChange(oEvent: any) {
        this.selectedLines = oEvent.getSource().getSelectedIndices();
        if (this.selectedLines.length > 0) (this.byId("AddLine") as Button).setEnabled(true)
        else (this.byId("AddLine") as Button).setEnabled(false)

    }


    public gateQtyChange(oEvt: any) {
        let index = oEvt.getSource().getParent().getIndex();
        let currentLines = this.lines.getProperty("/EntryLines");

        let tol = 0
        if (currentLines[index].Tolerance) {
            tol = parseFloat(currentLines[index].BalQty) + parseFloat(currentLines[index].Tolerance)
        }

        if ((parseFloat(currentLines[index].GateQty) !== 0 && parseFloat(currentLines[index].GateQty) > tol && currentLines[index].DocumentNo)) {
            MessageBox.error("Gate Qty Greater than Balance Qty.");
            currentLines[index].GateQty = 0;
            this.lines.setProperty("/EntryLines", currentLines);
            return;
        }
        currentLines[index].GateValue = currentLines[index].GateQty * currentLines[index].Rate;
        this.lines.setProperty("/EntryLines", currentLines);
        oEvt.getSource().setValue(Number(currentLines[index].GateQty).toFixed(3));
    }

    public InQtyChange(oEvt: any) {
        let index = oEvt.getSource().getParent().getIndex(),
            currentLines = this.lines.getProperty("/EntryLines"),
            EntryType = this.gateEntry["Header"].EntryType;
        if (EntryType !== "RGP-IN" && EntryType !== "WREF") return;
        if (parseFloat(currentLines[index].InQty) > parseFloat(currentLines[index].BalQty) && EntryType === "RGP-IN") {
            MessageBox.error("In Qty cannot be greater than Balance Qty");
            currentLines[index].InQty = 0;
            this.lines.setProperty("/EntryLines", currentLines);
            return;
        }
        // if (parseFloat(currentLines[index].InQty) > parseFloat(currentLines[index].GateQty) && EntryType !== "WREF") {
        //     MessageBox.error("In Qty cannot be greater than Out Qty");
        //     currentLines[index].InQty = 0;
        //     this.lines.setProperty("/EntryLines", currentLines);
        //     return;
        // }
        currentLines[index].GateValue = currentLines[index].InQty * (currentLines[index].Rate || 0);
        this.lines.setProperty("/EntryLines", currentLines);
        oEvt.getSource().setValue(Number(currentLines[index].InQty).toFixed(3));
    }

    public rateChange(oEvt: any) {
        let index = oEvt.getSource().getParent().getIndex(),
            currentLines = this.lines.getProperty("/EntryLines"),
            EntryType = this.gateEntry["Header"].EntryType;

        if (EntryType === "RGP-IN" || EntryType === "WREF") currentLines[index].GateValue = (currentLines[index].InQty || 0) * currentLines[index].Rate;
        else currentLines[index].GateValue = currentLines[index].GateQty * currentLines[index].Rate;
        this.lines.setProperty("/EntryLines", currentLines);
    }




    public async onClickSave() {
        let that = this;
        let changes = (this.getView()!.getModel() as any).mChangedEntities;
        let updates = Object.keys(changes);

        // if (updates.length <= 0) {
        //     this.cancelDisable();
        //     return;
        // }
        BusyIndicator.show();

        let oButton = this.byId("_IDGenButton") as Button;
        this._MessageManager.removeAllMessages();
        this.oMP.getBinding("items").attachChange(function (oEvent: any) {
            that.oMP.navigateBack();
            oButton.setType(that.buttonTypeFormatter());
            oButton.setIcon(that.buttonIconFormatter());
            oButton.setText(that.highestSeverityMessages());
        }.bind(this));

        setTimeout(function () {
            that.oMP.openBy(oButton);
        }.bind(this), 100);

        this.oDataModel.setDeferredGroups(["updateDetails"])
        if (updates.length > 0) {
            for (let index = 0; index < updates.length; index++) {
                const key = updates[index];
                let val = this.oDataModel.getObject("/" + key);

                delete val.__metadata;
                delete val.Delete_mc;
                delete val.GateEntryNo;
                delete val.GateItemNo;

                this.oDataModel.update("/" + key, {
                    ...val,
                    ...changes[key]
                }, {
                    groupId: "updateDetails"
                })
            }
        }
        if (this.removedLines.length > 0) {
            for (let index = 0; index < this.removedLines.length; index++) {
                const element = this.removedLines[index];
                if (element.GateEntryNo && element.GateItemNo) {
                    this.oDataModel.remove("/GateEntryLines(GateEntryNo='" + element.GateEntryNo + "',GateItemNo='" + element.GateItemNo + "')", {
                        groupId: "updateDetails"
                    });
                }
            }
        }

        let lines = this.lines.getProperty("/EntryLines");
        if (lines.length > 0) {
            for (let index = 0; index < lines.length; index++) {
                const element = {...lines[index]};
                delete element.LineNum;
                element.GateValue = Number(element.GateValue).toFixed(2); 
                if (element.new) {
                    delete element.new;
                    this.oDataModel.create(this.gateEntry.full + "/to_GateEntryLines", element, {
                        groupId: "updateDetails"
                    });
                } else {
                    delete element.__metadata;
                    delete element.Delete_mc;
                    delete element.to_GateEntryHeader;
                    // delete element.GateEntryNo;
                    // delete element.GateItemNo;
                    this.oDataModel.update("/GateEntryLines(GateEntryNo='" + element.GateEntryNo + "',GateItemNo='" + element.GateItemNo + "')", element, {
                        groupId: "updateDetails"
                    });
                }
            }
        } else {
            MessageBox.error("All lines Cannot be delete from Gate Entry");
            BusyIndicator.hide();
            return;
        }


        let response = await this.rungroups(this.oDataModel, "updateDetails");
        let allSuccess = true;
        for (let index = 0; index < response?.data.__batchResponses.length; index++) {
            const element = response.data.__batchResponses[index];
            if (!element.response) continue;
            if (element.response.statusCode === '400') {
                allSuccess = false;
                this._MessageManager.addMessages(
                    new Message({
                        message: JSON.parse(element.response.body).error.message.value,
                        type: MessageType.Error,
                    })
                );
            }
        }
        if (allSuccess) this.cancelDisable();
        BusyIndicator.hide();
    }

    public async rungroups(OModel: ODataModel, group: string) {
        let res: any = await new Promise((resolve, reject) => {
            OModel.submitChanges({
                groupId: group,
                success: async function (oData: any, oResponse: any) {
                    resolve(oResponse)
                },
                error: function (oError: any) {
                    reject(oError)
                }
            })
        })
        return res;
    };












    public isPositionable(sControlId: any) {
        // Such a hook can be used by the application to determine if a control can be found/reached on the page and navigated to.
        return sControlId ? true : true;
    }

    public getGroupName(sControlId: any) {
        // the group name is generated based on the current layout
        // and is specific for each use case
        var oControl = ElementRegistry.get(sControlId);


        if (oControl) {
            // var sFormSubtitle = oControl.getParent().getParent().getTitle().getText(),
            //     sFormTitle = oControl.getParent().getParent().getParent().getTitle();

            // return sFormTitle + ", " + sFormSubtitle;
            return ""
        }
    }

    public createMessagePopover() {
        var that = this;

        this.oMP = new MessagePopover({
            activeTitlePress: function (oEvent) {
                var oItem = oEvent.getParameter("item"),
                    oPage = that.byId("_IDGenPage4"),
                    oMessage = (oItem as any).getBindingContext("message").getObject(),
                    oControl = ElementRegistry.get(oMessage.getControlId());

                if (oControl) {
                    (oPage as any).scrollToElement(oControl.getDomRef(), 200, [0, -100]);
                    setTimeout(function () {
                        if (oControl!.isFocusable()) {
                            oControl!.focus();
                        }
                    }.bind(this), 300);
                }
            },
            items: {
                path: "message>/",
                template: new MessageItem(
                    {
                        title: "{message>message}",
                        subtitle: "{message>additionalText}",
                        groupName: { parts: [{ path: 'message>controlIds' }], formatter: this.getGroupName },
                        activeTitle: { parts: [{ path: 'message>controlIds' }], formatter: this.isPositionable },
                        type: "{message>type}",
                        description: "{message>message}"
                    })
            },
            groupItems: true
        });


        this.byId("_IDGenButton")!.addDependent(this.oMP);
    }

    public handleMessagePopoverPress(oEvent: any) {
        if (!this.oMP) {
            this.createMessagePopover();
        }
        this.oMP.toggle(oEvent.getSource());
    }

    public addMessage(message: string, oInput: any, type: MessageType) {
        this._MessageManager.addMessages(
            new Message({
                message: message,
                type: type,
                target: oInput.getBindingPath("value"),
                processor: oInput.getBinding("value").getModel()
            })
        );

    }

    public removeMessageFromTarget(sTarget: any) {
        let that = this;
        this._MessageManager.getMessageModel().getData().forEach(function (oMessage: any) {
            if (oMessage.target === sTarget) {
                that._MessageManager.removeMessages(oMessage);
            }
        }.bind(this));
    }

    public buttonTypeFormatter() {
        var sHighestSeverity: any;
        var aMessages = this._MessageManager.getMessageModel().getData();
        aMessages.forEach(function (sMessage: any) {
            switch (sMessage.type) {
                case "Error":
                    sHighestSeverity = "Negative";
                    break;
                case "Warning":
                    sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
                    break;
                case "Success":
                    sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
                    break;
                default:
                    sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
                    break;
            }
        });

        return sHighestSeverity;
    }

    public highestSeverityMessages() {
        var sHighestSeverityIconType = this.buttonTypeFormatter();
        var sHighestSeverityMessageType: string = "";

        switch (sHighestSeverityIconType) {
            case "Negative":
                sHighestSeverityMessageType = "Error";
                break;
            case "Critical":
                sHighestSeverityMessageType = "Warning";
                break;
            case "Success":
                sHighestSeverityMessageType = "Success";
                break;
            default:
                sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                break;
        }

        return this._MessageManager.getMessageModel().getData().reduce(function (iNumberOfMessages: any, oMessageItem: any) {
            return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
        }, 0) || "";
    }

    public buttonIconFormatter() {
        var sIcon: any;
        var aMessages = this._MessageManager.getMessageModel().getData();

        aMessages.forEach(function (sMessage: any) {
            switch (sMessage.type) {
                case "Error":
                    sIcon = "sap-icon://error";
                    break;
                case "Warning":
                    sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                    break;
                case "Success":
                    sIcon = sIcon !== "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                    break;
                default:
                    sIcon = !sIcon ? "sap-icon://information" : sIcon;
                    break;
            }
        });

        return sIcon;
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
    /**-------------------VALUE HELPS--------------------------- */
    public DDialog: ValueHelpDialog;
    public _oBasicSearchField1: any;

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


    public handleDValueHelp(oEvent: any) {
        let that = this;
        this.valueHelpLineIndex = oEvent.getSource().getParent().getIndex();
        this._oBasicSearchField1 = new SearchField({
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
            oWhitespaceDialog.setSupportRanges(false);
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
            oFilterBar.setBasicSearch(that._oBasicSearchField1);

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
                        filters: [
                            new Filter("EntryType", FilterOperator.EQ, that.gateEntry["Header"].EntryType),
                            new Filter("Plant", FilterOperator.EQ, that.gateEntry["Header"].Plant)
                        ],
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
                        filters: [
                            new Filter("EntryType", FilterOperator.EQ, that.gateEntry["Header"].EntryType),
                            new Filter("Plant", FilterOperator.EQ, that.gateEntry["Header"].Plant)
                        ],
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
        var sSearchDery = this._oBasicSearchField1.getValue(),
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
                EntryType: that.gateEntry["Header"].EntryType
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
                let OProperty = that.lines.getProperty("/EntryLines") || [];
                let selectedDoc: string[] = [],
                    vendorName = that.gateEntry["Header"].InvoicePartyName || "",
                    emptyVend = false;

                for (let index = 0; index < response.results.length; index++) {
                    const object = response.results[index];

                    if (vendorName && response.results[index].InvoicingPartyName !== vendorName && that.gateEntry["Header"].EntryType !== 'PUR') {
                        if (!selectedDoc.includes(object.DocumentNo)) selectedDoc.push(object.DocumentNo);
                        continue;
                    }
                    else if (that.selectedVendor && response.results[index].InvoicingPartyName !== that.selectedVendor && that.gateEntry["Header"].EntryType === 'PUR') {
                        if (!selectedDoc.includes(object.DocumentNo)) selectedDoc.push(object.DocumentNo);
                        continue;
                    }
                    else if (!vendorName) { vendorName = object.InvoicingPartyName; emptyVend = true; that.selectedVendor = object.InvoicingPartyName; }

                    let obDate = new Date(object.DocumentDate)
                    // if (that.lowestDate.toDateString() > obDate.toDateString()) {
                    //     that.lowestDate = obDate;
                    // }

                    OProperty[that.valueHelpLineIndex as number].DocumentNo = object.DocumentNo;
                    OProperty[that.valueHelpLineIndex as number].DocumentItemNo = object.DocumentItemNo;
                    OProperty[that.valueHelpLineIndex as number].DocumentQty = Number(that.gateEntry["Header"].EntryType === "PUR" || that.gateEntry["Header"].EntryType === "RGP-OUT" ? 0 : object.DocumentItemQty).toFixed(3);
                    OProperty[that.valueHelpLineIndex as number].Plant = object.Plant;
                    OProperty[that.valueHelpLineIndex as number].SLoc = object.StorageLocation;
                    OProperty[that.valueHelpLineIndex as number].ProductCode = object.DocumentItem;
                    OProperty[that.valueHelpLineIndex as number].ProductDesc = object.DocumentItemText;
                    OProperty[that.valueHelpLineIndex as number].PartyCode = object.InvoicingParty;
                    OProperty[that.valueHelpLineIndex as number].PartyName = object.InvoicingPartyName;
                    OProperty[that.valueHelpLineIndex as number].GateQty = Number(that.gateEntry["Header"].EntryType === "PUR" || that.gateEntry["Header"].EntryType === "RGP-OUT" ? 0 : object.DocumentItemQty).toFixed(3);
                    OProperty[that.valueHelpLineIndex as number].GateValue = Number(object.DocumentItemPrice).toFixed(2);
                    OProperty[that.valueHelpLineIndex as number].UOM = object.DocumentItemQtyUnit;
                    OProperty[that.valueHelpLineIndex as number].Rate = Number(object.Rate).toFixed(2);
                    OProperty[that.valueHelpLineIndex as number].GST = object.GST;
                    OProperty[that.valueHelpLineIndex as number].OrderQty = Number(object.DocumentItemQty).toFixed(3);
                    OProperty[that.valueHelpLineIndex as number].BalQty = Number(object.BalQty).toFixed(3);
                    OProperty[that.valueHelpLineIndex as number].Tolerance = Number(object.ToleranceQty).toFixed(3);

                    // that.matchingPAN = object.InvoicingPartyPAN;
                }
                that.lines.setProperty("/EntryLines", OProperty);
                if (selectedDoc.length > 0) {
                    MessageBox.warning("Vendor Code Mismatch with Documents - " + selectedDoc.join(","));
                    if (!emptyVend) {
                        BusyIndicator.hide();
                        return;
                    }
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
            oWhitespaceDialog.setSupportRanges(false);
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
        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[this.valueHelpLineIndex as number].UOM = aTokens[0].mProperties.key;
        this.lines.setProperty("/EntryLines", OProperty);
        this.QUDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedQU(oEvt: any) {
        let name = oEvt.getParameters().selectedRow.getCells()[0].getText(),
            OProperty = this.lines.getProperty("/EntryLines");
        OProperty[oEvt.getSource().getParent().getIndex()].UOM = name;
        this.lines.setProperty("/EntryLines", OProperty);
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
            oWhitespaceDialog.setSupportRanges(false);
            oWhitespaceDialog.setRangeKeyFields([{
                label: "Product",
                key: "Product",
                type: "string",
                typeInstance: new TypeString({}, {
                    maxLength: 15
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
                    let OProperty = that.lines.getProperty("/EntryLines");
                    if (that.valueHelpLineIndex !== null) {
                        OProperty[that.valueHelpLineIndex].UOM = data.BaseUnit;
                        OProperty[that.valueHelpLineIndex].ProductDesc = data.ProductDescription;
                    }
                    that.lines.setProperty("/EntryLines", OProperty);
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
        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[this.valueHelpLineIndex as number].ProductCode = aTokens[0].mProperties.key;
        this.lines.setProperty("/EntryLines", OProperty);
        this.bulkrsDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedPC(oEvt: any) {
        let description = oEvt.getParameters().selectedRow.getCells()[1].getText(),
            name = oEvt.getParameters().selectedRow.getCells()[0].getText(),
            uom = oEvt.getParameters().selectedRow.getCells()[2].getText();

        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[oEvt.getSource().getParent().getIndex()].ProductCode = name;
        OProperty[oEvt.getSource().getParent().getIndex()].ProductDesc = description;
        OProperty[oEvt.getSource().getParent().getIndex()].UOM = uom;
        this.lines.setProperty("/EntryLines", OProperty);
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
            oWhitespaceDialog.setSupportRanges(false);
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

        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[this.valueHelpLineIndex as number].Plant = aTokens[0].mProperties.key;
        this.lines.setProperty("/EntryLines", OProperty);
        this.plantDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedPlant(oEvt: any) {
        let name = oEvt.getParameters().selectedRow.getCells()[0].getText();
        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[oEvt.getSource().getParent().getIndex()].Plant = name;
        this.lines.setProperty("/EntryLines", OProperty);
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
        this.valueHelpLineIndex = oEvent.getSource().getParent().getIndex();
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
            oWhitespaceDialog.setSupportRanges(false);
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
                        // filters: [new Filter("EntryType", FilterOperator.EQ, that.gateEntry["Header"].EntryType)],
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
                        // filters: [new Filter("EntryType", FilterOperator.EQ, that.gateEntry["Header"].EntryType)],
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
        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[this.valueHelpLineIndex as number].PartyCode = aTokens[0].mProperties.key;
        OProperty[this.valueHelpLineIndex as number].PartyName = aTokens[0].mProperties.text.split(" (")[0];
        this.lines.setProperty("/EntryLines", OProperty);
        this.PTCDialog.close();
        this.valueHelpLineIndex = null;
    }

    public onSuggestionItemSelectedPTC(oEvt: any) {
        let description = oEvt.getParameters().selectedRow.getCells()[1].getText(),
            name = oEvt.getParameters().selectedRow.getCells()[0].getText();

        let OProperty = this.lines.getProperty("/EntryLines");
        OProperty[oEvt.getSource().getParent().getIndex()].PartyCode = name;
        OProperty[oEvt.getSource().getParent().getIndex()].PartyName = description;
        this.lines.setProperty("/EntryLines", OProperty);
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




