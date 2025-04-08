@AccessControl.authorizationCheck: #CHECK
@EndUserText.label: 'Gate Entry Header CDS'
@Metadata.ignorePropagatedAnnotations: true
define root view entity ZR_GateEntryHeader as select from zgateentryheader as GateEntryHeader
composition [0..*] of ZR_GateEntryLines as _GateEntryLines
association [0..1] to ZI_GateEntryType as _gateentrytype on $projection.EntryType = _gateentrytype.Value
{
    
    key gateentryno as GateEntryNo,
    entrytype as EntryType,
    gateoutward as GateOutward,
    entrydate as EntryDate,
    invoiceno as InvoiceNo,
    invoicedate as InvoiceDate,
    refdocno as RefDocNo,
    billamount as BillAmount,
    lrno as LrNo,
    lrdate as LrDate,
    purpose as Purpose,
    gateindate as GateInDate,
    gateintime as GateInTime,
    expectrtdate as ExpectedReturnDate,
    transportmode as TransportMode,
    vehicleno as VehicleNo,
    transportername as TransporterName,
    vehrepdate as VehRepDate,
    vehreptime as VehRepTime,
    slipno as SlipNo,
    invoiceparty as InvoiceParty,
    invoicepartyname as InvoicePartyName,
    invoicepartygst as InvoicePartyGST,
    drivername as DriverName,
    driverlicenseno as DriverLicenseNo,
    driverno as DriverNo,
    remarks as Remarks,
    grosswt as GrossWt,
    tarewt as TareWt,
    netwt as NetWt,
    plant as Plant,
    sloc as SLoc,
    gateoutdate as GateOutDate,
    gateouttime as GateOutTime,
    requestedby as RequestedBy,
    cancelled as Cancelled,
    @Semantics.user.createdBy: true
    created_by as CreatedBy,
    @Semantics.systemDateTime.createdAt: true
    created_at as CreatedAt,
    @Semantics.user.localInstanceLastChangedBy: true
    last_changed_by as LastChangedBy,
    @Semantics.systemDateTime.localInstanceLastChangedAt: true
    last_changed_at as LastChangedAt,
    @Semantics.systemDateTime.lastChangedAt: true
    local_last_changed_at as LocalLastChangedAt,
    _GateEntryLines,
    _gateentrytype,
    _gateentrytype.Description as Gateentrytypedesc
}
