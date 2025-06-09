
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import ElementRegistry from "sap/ui/core/ElementRegistry";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import Messaging from "sap/ui/core/Messaging";
import ManagedObject from "sap/ui/base/ManagedObject";
import MessagePopover from "sap/m/MessagePopover";
import MessageItem from "sap/m/MessageItem";
import Button from "sap/m/Button";
import DateFormat from "sap/ui/core/format/DateFormat";
import MessageBox from "sap/m/MessageBox";

export default class Create extends Controller {

    public oDataModel: ODataModel;
    public gateEntryTypeJSON: any;
    public _MessageManager = Messaging;
    public oMP: any;
    public _pDialog: any;

    public onInit(): void {
        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY/");

        this._MessageManager.removeAllMessages();

        this._MessageManager.registerObject((this.byId("createHeaderForm") as any).byId("EntryHeader") as ManagedObject, true);
        this.getView()!.setModel(this._MessageManager.getMessageModel(), "message");
        this.createMessagePopover();
    }




    public cancel() {
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GateEntryMaintain")
    }

    public isTotalWithinLimit(items: any, limit = 2500) {
        let totalAmount = 0;

        for (let item of items) {
            let totalWithGST = item.GateValue + (item.GateValue * (item.GST || 0) / 100);
            totalAmount += totalWithGST;
        }

        return totalAmount <= limit;
    }

    public save() {
        // debugger;
        let that = this;
        let header = (this.byId("createHeaderForm") as any).byId("EntryHeader").getModel("Header").getProperty("/");
        let lines = (this.byId("createLines") as any).byId("_IDGenTable1")?.getModel("Details").getProperty("/OrderDetailsTable");

        if (lines.length <= 0) {
            MessageBox.error("No Lines Found in Gate Entry. Unable to save.");
            return;
        }

        for (let index = 0; index < lines.length; index++) {
            const data = lines[index];
            if (!data.Plant) {
                MessageBox.error("Plant is mandatory");
                return;
            }
            if (!data.UOM) {
                MessageBox.error("UOM is mandatory");
                return;
            }
            if (!data.ProductDesc) {
                MessageBox.error("Product is Mandatory. Unable to save.");
                return;
            };
            if (header.EntryType !== 'RGP-IN' && header.EntryType !== 'WREF') {
                if (!Number(data.GateQty)) {
                    MessageBox.error("No Qty Entered in Lines. Unable to save.");
                    return;
                }
            }
            else {
                if (!data.InQty) {
                    MessageBox.error("No Qty Entered in Lines. Unable to save.");
                    return;
                }
            }

        }



        if (header.EntryType === 'WREF' && !this.isTotalWithinLimit(lines)) {
            MessageBox.error("Total Amount is Greater than 2500");
            return;
        }

        header.GateOutward = 0;
        header.EntryDate = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" }).format(new Date());
        header.Plant = lines[0].Plant;

        if (header.EntryType === "PUR" || header.EntryType === "NRGP" || header.EntryType === "RGP-OUT" || header.EntryType === "WREF") {
            header.RefDocNo = lines[0].DocumentNo;
            delete header.GateOutDate;
            delete header.GateOutTime;
        } else {
            delete header.GateInDate;
            delete header.GateInTime;
        }

        let oButton = this.byId("_IDGenButton16") as Button;
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

        BusyIndicator.show();

        this.oDataModel.create("/GateEntryHeader", header, {
            success: async function (response: any) {
                let createdHeader = response.GateEntryNo;

                if (lines && lines.length > 0) {
                    that.oDataModel.setDeferredGroups(["CreateEntryLines"])
                    for (let i = 0; i < lines.length; i++) {

                        let newLine = {
                            ...lines[i],
                            "GateEntryNo": createdHeader,
                            "DocumentQty": Number(lines[i].DocumentQty || 0).toFixed(2),
                            "GateQty": Number(lines[i].GateQty || 0).toFixed(2),
                            "BalQty": Number(lines[i].BalQty || 0).toFixed(2),
                            "OrderQty": Number(lines[i].OrderQty || 0).toFixed(2),
                            "InQty": Number(lines[i].InQty || 0).toFixed(2),
                            "GateValue": Number(lines[i].GateValue || 0).toFixed(2),
                            "Rate": Number(lines[i].Rate || 0).toFixed(2),
                            "GST":Number(lines[i].GST || 0).toFixed(2) || "0.00"
                        }
                        delete newLine.LineNum;
                        delete newLine.Tolerance;
                        that.oDataModel.create(`/GateEntryHeader('${createdHeader}')/to_GateEntryLines`, newLine, {
                            groupId: "CreateEntryLines"
                        })
                    }

                    let response2 = await that.rungroups(that.oDataModel, "CreateEntryLines");

                }

                const router = (that.getOwnerComponent() as any).getRouter();
                router.navTo("GateEntryDetails", {
                    GateEntry: window.encodeURIComponent(`/GateEntryHeader('${createdHeader}')`)
                });
                BusyIndicator.hide();
            },
            error: function (error: any) {
                BusyIndicator.hide();
                that._MessageManager.addMessages(
                    new Message({
                        message: JSON.parse(error.responseText).error.message.value,
                        type: MessageType.Error,
                    })
                );
            }
        })
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


        this.byId("_IDGenButton16")!.addDependent(this.oMP);
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










}


