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
import SmartTable from "sap/ui/comp/smarttable/SmartTable";
import SmartForm from "sap/ui/comp/smartform/SmartForm";
import Button from "sap/m/Button";
import Page from "sap/m/Page";
import ManagedObject from "sap/ui/base/ManagedObject";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageBox from "sap/m/MessageBox";

export default class Details extends Controller {


    public oDataModel: ODataModel;
    public lines = new JSONModel();
    public _MessageManager = Messaging;
    public oMP: any;
    public gateEntry: any = {};
    public selectedLines: string[] = [];
    public blankAddedLines: string[] = [];


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

        this.oDataModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY/", {
            defaultCountMode: "None",
            defaultUpdateMethod: UpdateMethod.Merge,
        });
        this.oDataModel.setDefaultBindingMode("TwoWay");
        this.getView()!.setModel(this.oDataModel);

        this.cancelDisable();

        var that = this;
        this.oDataModel.getMetaModel().loaded().then(function () {
            that.byId("smartForm")!.bindElement(`/GateEntryHeader('${that.gateEntry.Gateentryno}')`);
            that.byId("_IDGenSmartTable2")!.bindElement(`/GateEntryLines`);
        });
        (this.byId("_IDGenSmartTable2") as SmartTable).rebindTable(true);


        // this.oDataModel.attachRequestCompleted(function (data: any) {
        //     let reqDetails = data.getParameters();
        //     if (reqDetails.url === `GateEntryHeader('${that.gateEntry.Gateentryno}')` && reqDetails.method === 'GET') {
        //         let headerRes = JSON.parse(data.getParameters().response.responseText).d;
        //         // (that.byId("CancelEntry") as Button).setVisible(false);
        //         // (that.byId("CancelEntry") as Button).setVisible(headerRes.cancelGateEntry_ac);
        //         (that.byId("Update") as Button).setVisible(headerRes.Update_mc);
        //         // (that.byId("Delete") as Button).setVisible(headerRes.Delete_mc);
        //     }
        // })

        this._MessageManager.removeAllMessages();

        this._MessageManager.registerObject(this.byId("smartForm") as ManagedObject, true);
        this.getView()!.setModel(this._MessageManager.getMessageModel(), "message");
        this.createMessagePopover();
        BusyIndicator.hide();

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
        this._MessageManager.removeAllMessages();
        (this.byId("Update") as Button).setVisible(false);
        (this.byId("_IDGenPage4") as Page).setShowFooter(true);
        (this.byId("_IDGenButton1") as Button).setVisible(true);
        (this.byId("_IDGenButton2") as Button).setVisible(true);
        
        (this.byId("smartForm") as SmartForm).setEditable(true);
        if((this.oDataModel as any).oData[`GateEntryHeader('${this.gateEntry.Gateentryno}')`].UpdateAllowed){
            (this.byId("_IDGenSmartTable2") as SmartTable).setEditable(true);
        }
    }


    public cancelDisable() {
        this._MessageManager.removeAllMessages();
        (this.byId("Update") as Button).setVisible(true);
        (this.byId("_IDGenPage4") as Page).setShowFooter(false);
        (this.byId("_IDGenButton1") as Button).setVisible(false);
        (this.byId("_IDGenButton2") as Button).setVisible(false);

        (this.byId("smartForm") as SmartForm).setEditable(false);
        (this.byId("_IDGenSmartTable2") as SmartTable).setEditable(false);
    }


    public onClickAddLine(oEvent: any): void {
        let that = this;

        this.oDataModel.create(`/GateEntryHeader('${this.gateEntry.Gateentryno}')/to_GateEntryLines`, { GateEntryNo: this.gateEntry.Gateentryno }, {
            success: function (response: any) {
                that.blankAddedLines.push(`/GateEntryLines(GateEntryNo='${response.GateEntryNo}',GateItemNo='${response.GateItemNo}')`)
            },
            error: function (error: any) {
                console.log(error)
            }
        })
    }

    public async onClickRemoveLine(oEvent: any) {
        BusyIndicator.show();
        let that = this;
        this.oDataModel.setDeferredGroups(["deleteLines"]);
        if (this.selectedLines.length > 0) {
            for (let i = 0; i < this.selectedLines.length; i++) {

                this.oDataModel.read("/GateEntryLines", {
                    urlParameters: {
                        "$top": "1",
                        "$skip": (this.selectedLines[i]).toString(),
                        "$filter":`GateEntryNo eq '${this.gateEntry.Gateentryno}'`

                    },
                    groupId: "deleteLines",
                    success:function(response:any){
                        let removestr = `/GateEntryLines(GateEntryNo='${response.results[0].GateEntryNo}',GateItemNo='${response.results[0].GateItemNo}')`;
                        that.oDataModel.remove(removestr, {
                            // groupId: "deleteLines",
                            headers: {
                                "If-Match": "*"
                            }
                        })

                    }
                })

            }
        }
        let response = await this.rungroups(this.oDataModel, "deleteLines");
        (this.byId("_IDGenButton2") as Button).setEnabled(false);
        this.selectedLines = [];
        BusyIndicator.hide();
    }

    public onSelectionChange(oEvent: any) {
        this.selectedLines = oEvent.getSource().getSelectedIndices();
        if (this.selectedLines.length > 0) (this.byId("_IDGenButton2") as Button).setEnabled(true)
        else (this.byId("_IDGenButton2") as Button).setEnabled(false)

    }



    public async onClickSave() {
        let that = this;
        let changes = (this.getView()!.getModel() as any).mChangedEntities;
        let updates = Object.keys(changes);
        
        if(updates.length<=0){
            this.cancelDisable();
            return;
        }
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
                if (this.blankAddedLines.includes("/" + key)) this.blankAddedLines = this.blankAddedLines.filter(data => data != "/" + key);
                let val = this.oDataModel.getObject("/"+key);

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
        if (this.blankAddedLines.length > 0) {
            for (let index = 0; index < this.blankAddedLines.length; index++) {
                const element = this.blankAddedLines[index];
                this.oDataModel.remove(element, {
                    groupId: "updateDetails"
                })
            }
            this.blankAddedLines = [];
        }

        let response = await this.rungroups(this.oDataModel, "updateDetails");
        let allSuccess = true;
        for (let index = 0; index < response?.data.__batchResponses.length; index++) {
            const element = response.data.__batchResponses[index];
            if(!element.response) continue;
            if(element.response.statusCode === '400'){
                allSuccess = false;
                this._MessageManager.addMessages(
                    new Message({
                        message: JSON.parse(element.response.body).error.message.value,
                        type: MessageType.Error,
                    })
                );
            }
        }
        if(allSuccess)  this.cancelDisable();
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

}




