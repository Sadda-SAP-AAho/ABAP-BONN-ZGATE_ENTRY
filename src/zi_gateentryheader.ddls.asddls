@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Gate Entry Header Interface View'
define root view entity ZI_GateEntryHeader 
  provider contract transactional_interface
  as projection on ZR_GateEntryHeader as GateEntryHeader
{
    
    key GateEntryNo,
    EntryType,
    GateOutward,
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
   /* Associations */
    _GateEntryLines : redirected to composition child ZI_GateEntryLines
}
