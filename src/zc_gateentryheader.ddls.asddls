@AccessControl.authorizationCheck: #CHECK
@Metadata.allowExtensions: true
@EndUserText.label: 'Gate Entry Header Projection View'
@ObjectModel.semanticKey: [ 'Gateentryno' ]
@Search.searchable: true
define root view entity ZC_GateEntryHeader 
  provider contract transactional_query
  as projection on ZR_GateEntryHeader as GateEntryHeader
{
    @Search.defaultSearchElement: true
    @Search.fuzzinessThreshold: 0.90 
    @UI.connectedFields: [{label: 'Token Number'}]
    key GateEntryNo,
    EntryType,
    GateOutward,
    @UI.connectedFields: [{label: 'Entry Date'}]
    EntryDate,
    InvoiceNo,
    InvoiceDate,
    RefDocNo,
    BillAmount,
    LrNo,
    LrDate,
    Purpose,
    GateInDate,
    GateInTime,
    ExpectedReturnDate,
    TransportMode,
    VehicleNo,
    TransporterName,
    VehRepDate,
    VehRepTime,
    SlipNo,
    InvoiceParty,
    InvoicePartyName,
    InvoicePartyGST,
    DriverName,
    DriverLicenseNo,
    DriverNo,
    Remarks,
    GrossWt,
    TareWt,
    NetWt,
    Plant,
    SLoc,
    GateOutDate,
    GateOutTime,
    RequestedBy,
    Cancelled,
    CreatedBy,
    CreatedAt,
    LastChangedBy,
    LastChangedAt,
    LocalLastChangedAt,
    Gateentrytypedesc,
      @ObjectModel.virtualElementCalculatedBy: 'ABAP:ZCL_GE_BHV'
  virtual UpdateAllowed : abap_boolean,
     @ObjectModel.virtualElementCalculatedBy: 'ABAP:ZCL_GATETIMEDIFF'
    @EndUserText.label: 'Time Difference'
        virtual Timedifference : abap.int2,
    
    /* Associations */
    _GateEntryLines : redirected to composition child ZC_GateEntryLines
  
}
