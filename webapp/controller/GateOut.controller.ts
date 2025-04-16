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
import ManagedObject from "sap/ui/base/ManagedObject";
import DateFormat from "sap/ui/core/format/DateFormat";

export default class Details extends Controller {


    public oDataModel: ODataModel;
    public _MessageManager = Messaging;
    public oMP: any;

    public onInit(): void {
        let oRouter = (this.getOwnerComponent() as any).getRouter()
        oRouter.getRoute("GateEntryOut").attachPatternMatched(this.getDetails, this);
    }

    public getDetails(oEvent: any): void {

        BusyIndicator.show();
        let avcLic = window.decodeURIComponent((<any>oEvent.getParameter("arguments")).GateEntry);

  

        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY/", {
            defaultCountMode: "None",
            defaultUpdateMethod: UpdateMethod.Merge,
        });
        this.oDataModel.setDefaultBindingMode("TwoWay");
        this.getView()!.setModel(this.oDataModel);

        var that = this;
        this.oDataModel.getMetaModel().loaded().then(function () {
            that.byId("_IDGenSmartForm")!.bindElement(`/GateEntryHeader('${avcLic}')`);
        });

        this._MessageManager.removeAllMessages();

        var oNow = new Date();

        // Format date as "yyyy-MM-ddTHH:mm:ss" (for DatePicker)
        var oDateFormatter = DateFormat.getDateInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" });
        var sFormattedDate = oDateFormatter.format(oNow);

        (this.byId("_IDGenSmartField10") as any).setValue(sFormattedDate);

        this._MessageManager.registerObject(this.byId("_IDGenSmartForm") as ManagedObject, true);
        this.getView()!.setModel(this._MessageManager.getMessageModel(), "message");
        this.createMessagePopover();
        BusyIndicator.hide();

    }

    public cancelDisable() {
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GateEntryMaintain")
    }


  

    public async onClickSave() {
        BusyIndicator.show();
        let that = this;
        let changes = (this.getView()!.getModel() as any).mChangedEntities;
        let updates = Object.keys(changes);
        if (updates.length > 0) {
            this.oDataModel.setDeferredGroups(["updateDetails"])
            for (let index = 0; index < updates.length; index++) {
                const key = updates[index];
                const value = changes[key];

                this.oDataModel.update("/" + key, value, {
                    groupId: "updateDetails",
                    success: function (response: any) {
                        const router = (that.getOwnerComponent() as any).getRouter();
                        router.navTo("GateEntryMaintain")
                    }
                })
            }
        }
        let response = await this.rungroups(this.oDataModel, "updateDetails");
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


        this.byId("_IDGenButton3")!.addDependent(this.oMP);
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




